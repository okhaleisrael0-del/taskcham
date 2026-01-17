import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Calculate dynamic pricing based on real-time data
 * Factors: time of day, weather, demand, area
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { 
      basePrice, 
      serviceArea, 
      serviceType,
      scheduledDate,
      pickupLat,
      pickupLng 
    } = await req.json();

    // Get active pricing rules
    const rules = await base44.asServiceRole.entities.DynamicPricingRule.filter(
      { is_active: true },
      '-priority'
    );

    // Get current context
    const now = new Date(scheduledDate || Date.now());
    const hour = now.getHours();
    const dayOfWeek = now.getDay();
    
    // Get weather data
    let weatherData = { condition: 'clear', temp: 15 };
    try {
      const weatherResponse = await base44.asServiceRole.functions.invoke('getWeatherData', {
        lat: pickupLat,
        lng: pickupLng
      });
      weatherData = weatherResponse.data;
    } catch (error) {
      console.error('Weather fetch failed:', error);
    }

    // Get current demand (active bookings in area)
    const activeBookings = await base44.asServiceRole.entities.Booking.filter({
      status: ['assigned', 'on_the_way', 'picked_up', 'in_progress']
    });
    const demandCount = activeBookings.length;

    // Apply pricing rules
    let finalPrice = basePrice;
    const adjustmentsApplied = [];

    for (const rule of rules) {
      let applies = false;
      let reason = '';

      // Check if rule applies
      if (rule.rule_type === 'time_based' && rule.conditions?.time_ranges) {
        for (const range of rule.conditions.time_ranges) {
          if (
            hour >= range.start_hour && 
            hour < range.end_hour &&
            (!range.days || range.days.includes(dayOfWeek))
          ) {
            applies = true;
            reason = `Rusningstid (${range.start_hour}:00-${range.end_hour}:00)`;
            break;
          }
        }
      }

      if (rule.rule_type === 'weather_based' && rule.conditions?.weather_conditions) {
        if (rule.conditions.weather_conditions.includes(weatherData.condition)) {
          applies = true;
          reason = `Väderförhållanden: ${weatherData.condition}`;
        }
      }

      if (rule.rule_type === 'demand_based' && rule.conditions?.demand_threshold) {
        if (demandCount >= rule.conditions.demand_threshold) {
          applies = true;
          reason = `Hög efterfrågan (${demandCount} aktiva uppdrag)`;
        }
      }

      if (rule.rule_type === 'area_based' && rule.conditions?.service_areas) {
        if (rule.conditions.service_areas.includes(serviceArea)) {
          applies = true;
          reason = `Område: ${serviceArea}`;
        }
      }

      // Apply adjustment if rule applies
      if (applies) {
        let adjustment = 0;
        if (rule.adjustment_type === 'percentage') {
          adjustment = finalPrice * (rule.adjustment_value / 100);
        } else {
          adjustment = rule.adjustment_value;
        }

        finalPrice += adjustment;
        
        adjustmentsApplied.push({
          rule_name: rule.rule_name,
          rule_type: rule.rule_type,
          adjustment_value: adjustment,
          adjustment_type: rule.adjustment_type,
          reason: reason
        });
      }
    }

    // Create price adjustment log
    const logEntry = {
      original_price: basePrice,
      final_price: Math.round(finalPrice),
      total_adjustment: Math.round(finalPrice - basePrice),
      adjustments_applied: adjustmentsApplied,
      context_data: {
        time_of_day: `${hour}:00`,
        day_of_week: ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'][dayOfWeek],
        weather: weatherData.condition,
        temperature: weatherData.temp,
        active_bookings_count: demandCount,
        service_area: serviceArea
      },
      customer_email: user.email
    };

    return Response.json({
      originalPrice: basePrice,
      finalPrice: Math.round(finalPrice),
      adjustments: adjustmentsApplied,
      contextData: logEntry.context_data,
      logEntry: logEntry
    });

  } catch (error) {
    console.error('Dynamic pricing error:', error);
    return Response.json({ 
      error: error.message,
      originalPrice: 0,
      finalPrice: 0,
      adjustments: []
    }, { status: 500 });
  }
});