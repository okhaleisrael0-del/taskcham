import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not set');
      return Response.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    // Verify webhook signature
    let event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    console.log('Webhook event received:', event.type);

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const bookingNumber = session.metadata.booking_number;

      console.log('Payment completed for booking:', bookingNumber);

      // Find and update the booking
      const bookings = await base44.asServiceRole.entities.Booking.filter({
        booking_number: bookingNumber
      });

      if (bookings.length > 0) {
        const booking = bookings[0];
        
        // Update payment status
        await base44.asServiceRole.entities.Booking.update(booking.id, {
          payment_status: 'paid',
          payment_id: session.payment_intent,
          payment_date: new Date().toISOString(),
          payment_amount: session.amount_total / 100
        });
        
        // Update booking status to 'paid' via status flow
        try {
          await base44.asServiceRole.functions.invoke('updateBookingStatus', {
            booking_id: booking.id,
            new_status: 'paid',
            reason: 'Stripe payment completed'
          });
          console.log('Booking status updated to paid');
        } catch (statusError) {
          console.error('Failed to update booking status:', statusError);
        }
      }
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      console.log('PaymentIntent succeeded:', paymentIntent.id);
    }

    return Response.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});