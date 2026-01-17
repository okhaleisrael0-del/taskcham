import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Auto-generate receipt when booking is completed
 * Called via automation or manually
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { booking_id } = await req.json();

    if (!booking_id) {
      return Response.json({ error: 'booking_id required' }, { status: 400 });
    }

    const bookings = await base44.asServiceRole.entities.Booking.filter({ id: booking_id });
    const booking = bookings[0];

    if (!booking) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if receipt already exists
    const existing = await base44.asServiceRole.entities.Receipt.filter({ booking_id: booking.id });
    if (existing.length > 0) {
      return Response.json({ 
        success: true, 
        receipt: existing[0],
        message: 'Receipt already exists' 
      });
    }

    const receiptNumber = `RCP-${Date.now().toString().slice(-10)}`;
    
    const subtotal = booking.base_price + (booking.distance_fee || 0) + 
                     (booking.add_ons?.reduce((sum, a) => sum + a.price, 0) || 0);
    const vatAmount = Math.round(booking.total_price * 0.25); // 25% Swedish VAT

    const receipt = await base44.asServiceRole.entities.Receipt.create({
      receipt_number: receiptNumber,
      booking_id: booking.id,
      booking_number: booking.booking_number,
      customer_email: booking.customer_email,
      customer_name: booking.customer_name,
      service_type: booking.service_type,
      service_description: booking.item_description || booking.service_type,
      service_date: booking.completed_date || new Date().toISOString(),
      base_price: booking.base_price,
      distance_fee: booking.distance_fee || 0,
      add_ons: booking.add_ons || [],
      subtotal: subtotal,
      discount_amount: booking.discount_amount || 0,
      promo_code: booking.promo_code,
      vat_amount: vatAmount,
      total_amount: booking.total_price,
      payment_method: 'Stripe Card',
      payment_id: booking.payment_id,
      runner_name: booking.assigned_driver_name,
      business_account_id: booking.business_account_id
    });

    // Send receipt email
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: booking.customer_email,
      subject: `Kvitto från TaskCham - #${booking.booking_number}`,
      body: `
        <html>
          <body style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #4A90A4 0%, #7FB069 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1>📄 Ditt Kvitto</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none;">
              <p>Hej ${booking.customer_name}!</p>
              <p>Tack för att du använde TaskCham. Här är ditt kvitto:</p>
              
              <div style="background: #f0f9ff; padding: 20px; margin: 20px 0; border-radius: 8px;">
                <p><strong>Bokningsnummer:</strong> ${booking.booking_number}</p>
                <p><strong>Kvittonummer:</strong> ${receiptNumber}</p>
                <p><strong>Datum:</strong> ${new Date(receipt.service_date).toLocaleDateString('sv-SE')}</p>
              </div>

              <table style="width: 100%; margin: 20px 0;">
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 10px 0;">Grundpris</td>
                  <td style="text-align: right; padding: 10px 0;">${booking.base_price} kr</td>
                </tr>
                ${booking.distance_fee > 0 ? `
                <tr style="border-bottom: 1px solid #ddd;">
                  <td style="padding: 10px 0;">Avstånd</td>
                  <td style="text-align: right; padding: 10px 0;">${booking.distance_fee} kr</td>
                </tr>` : ''}
                ${booking.discount_amount > 0 ? `
                <tr style="border-bottom: 1px solid #ddd; color: green;">
                  <td style="padding: 10px 0;">Rabatt (${booking.promo_code})</td>
                  <td style="text-align: right; padding: 10px 0;">-${booking.discount_amount} kr</td>
                </tr>` : ''}
                <tr style="border-top: 2px solid #4A90A4;">
                  <td style="padding: 15px 0; font-weight: bold; font-size: 18px;">Totalt (inkl. moms)</td>
                  <td style="text-align: right; padding: 15px 0; font-weight: bold; font-size: 18px; color: #4A90A4;">${booking.total_price} kr</td>
                </tr>
              </table>

              ${booking.assigned_driver_name ? `
              <div style="background: #f8f9fa; padding: 15px; border-radius: 8px;">
                <p style="margin: 0;"><strong>Utfört av:</strong> ${booking.assigned_driver_name}</p>
              </div>` : ''}
            </div>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666;">
              <p>TaskCham AB • info@taskcham.se</p>
            </div>
          </body>
        </html>
      `
    });

    return Response.json({ 
      success: true, 
      receipt,
      receipt_number: receiptNumber
    });

  } catch (error) {
    console.error('Receipt generation error:', error);
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});