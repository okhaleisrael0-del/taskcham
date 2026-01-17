import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Records promo code usage after successful payment
 * Called from Stripe webhook or payment completion
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { booking_id, promo_code_id, code, user_email, discount_amount, original_price, final_price } = await req.json();

    if (!booking_id || !promo_code_id) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Record usage
    await base44.asServiceRole.entities.PromoCodeUsage.create({
      promo_code_id,
      code,
      user_email,
      booking_id,
      booking_number: (await base44.asServiceRole.entities.Booking.filter({ id: booking_id }))[0]?.booking_number,
      discount_amount,
      original_price,
      final_price
    });

    // Increment promo code usage count
    const promoCodes = await base44.asServiceRole.entities.PromoCode.filter({ id: promo_code_id });
    const promo = promoCodes[0];
    
    if (promo) {
      await base44.asServiceRole.entities.PromoCode.update(promo_code_id, {
        used_count: (promo.used_count || 0) + 1
      });
    }

    return Response.json({ success: true });

  } catch (error) {
    console.error('Error recording promo usage:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});