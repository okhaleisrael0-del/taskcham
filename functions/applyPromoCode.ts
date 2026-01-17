import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code, booking_total, user_email } = await req.json();

    if (!code || !booking_total || !user_email) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Find promo code
    const promoCodes = await base44.entities.PromoCode.filter({ 
      code: code.toUpperCase(),
      is_active: true 
    });

    if (promoCodes.length === 0) {
      return Response.json({ 
        valid: false, 
        error: 'Ogiltig kampanjkod' 
      });
    }

    const promo = promoCodes[0];

    // Check validity dates
    const now = new Date();
    if (promo.valid_from && new Date(promo.valid_from) > now) {
      return Response.json({ valid: false, error: 'Kampanjkoden är inte aktiv än' });
    }
    if (promo.valid_until && new Date(promo.valid_until) < now) {
      return Response.json({ valid: false, error: 'Kampanjkoden har utgått' });
    }

    // Check usage limit
    if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
      return Response.json({ valid: false, error: 'Kampanjkoden har använts maximalt antal gånger' });
    }

    // Check per-user limit
    const userUsage = await base44.entities.PromoCodeUsage.filter({
      promo_code_id: promo.id,
      user_email: user_email
    });

    if (userUsage.length >= (promo.per_user_limit || 1)) {
      return Response.json({ valid: false, error: 'Du har redan använt denna kampanjkod' });
    }

    // Check first order requirement
    if (promo.type === 'first_order') {
      const userBookings = await base44.entities.Booking.filter({
        customer_email: user_email,
        payment_status: 'paid'
      });
      
      if (userBookings.length > 0) {
        return Response.json({ valid: false, error: 'Denna kod är endast för nya kunder' });
      }
    }

    // Check minimum order
    if (promo.minimum_order && booking_total < promo.minimum_order) {
      return Response.json({ 
        valid: false, 
        error: `Minsta ordervärde är ${promo.minimum_order} kr` 
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.type === 'percentage' || promo.type === 'first_order') {
      discountAmount = Math.round(booking_total * (promo.discount_value / 100));
      if (promo.max_discount) {
        discountAmount = Math.min(discountAmount, promo.max_discount);
      }
    } else {
      discountAmount = promo.discount_value;
    }

    // Don't exceed total
    discountAmount = Math.min(discountAmount, booking_total);

    const finalPrice = booking_total - discountAmount;

    return Response.json({
      valid: true,
      promo_code_id: promo.id,
      code: promo.code,
      discount_amount: discountAmount,
      original_price: booking_total,
      final_price: finalPrice,
      description: promo.description
    });

  } catch (error) {
    console.error('Promo code error:', error);
    return Response.json({ 
      valid: false,
      error: error.message 
    }, { status: 500 });
  }
});