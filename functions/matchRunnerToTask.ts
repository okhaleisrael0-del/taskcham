import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { booking_id } = await req.json();

    if (!booking_id) {
      return Response.json({ error: 'booking_id required' }, { status: 400 });
    }

    // Get booking details
    const [booking] = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get all available drivers/helpers
    const allDrivers = await base44.asServiceRole.entities.Driver.filter({
      status: 'approved',
      dashboard_access: 'active'
    });

    // Get ratings for drivers
    const ratings = await base44.asServiceRole.entities.Rating.list();

    // Calculate match score for each driver
    const matchScores = allDrivers.map(driver => {
      let score = 0;
      const factors = [];

      // 1. Availability (40 points)
      if (driver.availability === 'available') {
        score += 40;
        factors.push({ name: 'Availability', points: 40, status: 'available' });
      } else if (driver.availability === 'busy') {
        score += 10;
        factors.push({ name: 'Availability', points: 10, status: 'busy' });
      } else {
        factors.push({ name: 'Availability', points: 0, status: 'offline' });
      }

      // 2. Expertise Match (30 points)
      if (booking.service_type === 'help_at_home' && booking.help_service_type) {
        const expertiseMap = {
          'pet_care': 'pet_care',
          'dishes_cleanup': 'dishes_cleanup',
          'household_help': 'household_help',
          'store_pickup': 'store_pickup',
          'parcel_returns': 'parcel_returns',
          'elderly_support': 'elderly_support'
        };
        
        const requiredExpertise = expertiseMap[booking.help_service_type];
        if (driver.expertise && driver.expertise.includes(requiredExpertise)) {
          score += 30;
          factors.push({ name: 'Expertise Match', points: 30, match: true });
        } else if (driver.expertise && driver.expertise.includes('household_help')) {
          // General household help as fallback
          score += 15;
          factors.push({ name: 'General Helper', points: 15, match: 'partial' });
        } else {
          factors.push({ name: 'Expertise Match', points: 0, match: false });
        }
      }

      // 3. Ratings & Performance (20 points)
      const driverRatings = ratings.filter(r => r.driver_id === driver.id);
      if (driverRatings.length > 0) {
        const avgRating = driverRatings.reduce((sum, r) => sum + r.rating, 0) / driverRatings.length;
        const ratingScore = (avgRating / 5) * 20;
        score += ratingScore;
        factors.push({ 
          name: 'Customer Rating', 
          points: Math.round(ratingScore), 
          average: avgRating.toFixed(1),
          count: driverRatings.length 
        });
      } else {
        factors.push({ name: 'Customer Rating', points: 0, note: 'No ratings yet' });
      }

      // 4. Experience (10 points)
      const experienceScore = Math.min((driver.completed_tasks || 0) / 10, 1) * 10;
      score += experienceScore;
      factors.push({ 
        name: 'Experience', 
        points: Math.round(experienceScore), 
        completed: driver.completed_tasks || 0 
      });

      return {
        driver_id: driver.id,
        driver_name: driver.name,
        driver_email: driver.email,
        driver_phone: driver.phone,
        availability: driver.availability,
        expertise: driver.expertise || [],
        total_score: Math.round(score),
        max_score: 100,
        match_percentage: Math.round((score / 100) * 100),
        score_factors: factors,
        completed_tasks: driver.completed_tasks || 0,
        average_rating: driverRatings.length > 0 
          ? (driverRatings.reduce((sum, r) => sum + r.rating, 0) / driverRatings.length).toFixed(1)
          : 'N/A'
      };
    });

    // Sort by score descending
    matchScores.sort((a, b) => b.total_score - a.total_score);

    return Response.json({
      booking_id,
      booking_type: booking.service_type,
      help_service_type: booking.help_service_type,
      total_candidates: matchScores.length,
      matches: matchScores,
      best_match: matchScores[0] || null,
      top_3: matchScores.slice(0, 3)
    });

  } catch (error) {
    console.error('Match runner error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});