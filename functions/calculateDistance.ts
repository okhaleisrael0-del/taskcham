import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Haversine formula to calculate distance between two points
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { pickup_lat, pickup_lng, delivery_lat, delivery_lng } = await req.json();

    if (!pickup_lat || !pickup_lng || !delivery_lat || !delivery_lng) {
      return Response.json({ 
        error: 'Missing coordinates' 
      }, { status: 400 });
    }

    // Calculate distance
    const distance = calculateHaversineDistance(
      pickup_lat, 
      pickup_lng, 
      delivery_lat, 
      delivery_lng
    );

    // Get active pricing config
    const pricingConfigs = await base44.asServiceRole.entities.PricingConfig.filter({ is_active: true });
    const pricing = pricingConfigs[0] || {
      base_city_price: 49,
      per_km_price: 8
    };

    // Calculate price: base + (distance * per_km_rate)
    const basePrice = pricing.base_city_price || 49;
    const perKmRate = pricing.per_km_price || 8;
    const distanceFee = Math.round(distance * perKmRate);
    const totalPrice = Math.round(basePrice + distanceFee);

    return Response.json({
      distance_km: parseFloat(distance.toFixed(2)),
      base_price: basePrice,
      distance_fee: distanceFee,
      total_price: totalPrice,
      per_km_rate: perKmRate
    });

  } catch (error) {
    console.error('Distance calculation error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});