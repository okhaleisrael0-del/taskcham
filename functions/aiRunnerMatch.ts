import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * AI-driven runner matching system
 * Analyzes historical performance, ratings, location, and task complexity
 * to suggest the best runners for a specific booking
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { booking_id } = await req.json();
    
    if (!booking_id) {
      return Response.json({ error: 'booking_id required' }, { status: 400 });
    }

    // Get booking details
    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    const booking = bookings[0];
    
    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Get all available drivers
    const allDrivers = await base44.asServiceRole.entities.Driver.filter({ 
      status: 'approved',
      dashboard_access: 'active'
    });

    // Get all bookings for performance analysis
    const allBookings = await base44.asServiceRole.entities.Booking.list('-created_date', 500);
    
    // Get all ratings
    const allRatings = await base44.asServiceRole.entities.Rating.list('-created_date', 500);

    // Calculate match score for each driver
    const driverScores = allDrivers.map(driver => {
      let score = 0;
      const reasons = [];

      // 1. Availability (critical)
      if (driver.availability !== 'available') {
        return { driver, score: 0, reasons: ['Inte tillgänglig'] };
      }
      score += 20;
      reasons.push('Tillgänglig');

      // 2. Service area match
      if (booking.area_type && driver.service_areas?.includes(booking.area_type)) {
        score += 15;
        reasons.push(`Jobbar i ${booking.area_type}`);
      }

      // 3. Vehicle requirement
      if (booking.item_size === 'medium') {
        if (driver.vehicle_type === 'none') {
          return { driver, score: 0, reasons: ['Behöver fordon'] };
        }
        score += 10;
      }

      // 4. Expertise for help_at_home
      if (booking.service_type === 'help_at_home' && booking.help_service_type) {
        if (driver.expertise?.includes(booking.help_service_type)) {
          score += 20;
          reasons.push(`Expert på ${booking.help_service_type}`);
        } else {
          score -= 10;
        }
      }

      // 5. Historical performance
      const driverBookings = allBookings.filter(b => b.assigned_driver_id === driver.id);
      const completedBookings = driverBookings.filter(b => b.status === 'completed');
      
      if (driverBookings.length > 0) {
        const completionRate = (completedBookings.length / driverBookings.length) * 100;
        
        if (completionRate >= 90) {
          score += 15;
          reasons.push(`${completionRate.toFixed(0)}% slutförda`);
        } else if (completionRate >= 75) {
          score += 10;
        } else {
          score -= 5;
        }
      }

      // 6. Average rating
      const driverRatings = allRatings.filter(r => r.driver_id === driver.id);
      if (driverRatings.length > 0) {
        const avgRating = driverRatings.reduce((sum, r) => sum + r.rating, 0) / driverRatings.length;
        
        if (avgRating >= 4.5) {
          score += 15;
          reasons.push(`⭐ ${avgRating.toFixed(1)} betyg`);
        } else if (avgRating >= 4.0) {
          score += 10;
        } else if (avgRating < 3.5) {
          score -= 10;
        }
      }

      // 7. Experience with similar tasks
      const similarTasks = driverBookings.filter(b => 
        b.service_type === booking.service_type &&
        b.status === 'completed'
      );
      
      if (similarTasks.length >= 5) {
        score += 10;
        reasons.push(`${similarTasks.length} liknande uppdrag`);
      } else if (similarTasks.length >= 2) {
        score += 5;
      }

      // 8. Current workload
      const activeBookings = driverBookings.filter(b => 
        ['assigned', 'picked_up', 'on_the_way', 'in_progress'].includes(b.status)
      );
      
      if (activeBookings.length === 0) {
        score += 10;
        reasons.push('Ingen aktiv bokning');
      } else if (activeBookings.length >= 2) {
        score -= 10;
        reasons.push(`${activeBookings.length} aktiva uppdrag`);
      }

      // 9. Recent activity (prefer active runners)
      const recentBookings = driverBookings.filter(b => {
        const bookingDate = new Date(b.created_date);
        const daysSince = (Date.now() - bookingDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysSince <= 7;
      });
      
      if (recentBookings.length >= 3) {
        score += 5;
        reasons.push('Aktiv senaste veckan');
      }

      return { 
        driver, 
        score: Math.max(0, Math.min(100, score)), // Clamp between 0-100
        reasons,
        stats: {
          total_bookings: driverBookings.length,
          completed: completedBookings.length,
          completion_rate: driverBookings.length > 0 ? (completedBookings.length / driverBookings.length * 100) : 0,
          avg_rating: driverRatings.length > 0 ? 
            (driverRatings.reduce((sum, r) => sum + r.rating, 0) / driverRatings.length) : 0,
          similar_tasks: similarTasks.length,
          active_bookings: activeBookings.length
        }
      };
    });

    // Sort by score and filter out very low scores
    const topMatches = driverScores
      .filter(d => d.score >= 20) // Minimum viable score
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Top 5 matches

    return Response.json({
      success: true,
      booking: {
        id: booking.id,
        booking_number: booking.booking_number,
        service_type: booking.service_type,
        area_type: booking.area_type
      },
      matches: topMatches.map(m => ({
        driver_id: m.driver.id,
        driver_name: m.driver.name,
        driver_phone: m.driver.phone,
        score: m.score,
        match_level: m.score >= 70 ? 'excellent' : m.score >= 50 ? 'good' : 'acceptable',
        reasons: m.reasons,
        stats: m.stats
      })),
      total_evaluated: allDrivers.length,
      available_drivers: allDrivers.filter(d => d.availability === 'available').length
    });

  } catch (error) {
    console.error('AI matching error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});