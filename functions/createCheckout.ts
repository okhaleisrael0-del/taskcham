import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
  apiVersion: '2024-12-18.acacia',
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { bookingData, successUrl, cancelUrl } = await req.json();

    console.log('Creating checkout session for booking:', bookingData);

    // Create line items based on booking
    const lineItems = [{
      price_data: {
        currency: 'sek',
        product_data: {
          name: `TaskCham ${bookingData.service_type?.replace('_', ' ')}`,
          description: `${bookingData.season || ''} ${bookingData.item_description || ''}`.trim(),
        },
        unit_amount: Math.round(bookingData.total_price * 100), // Convert to öre
      },
      quantity: 1,
    }];

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: bookingData.customer_email,
      metadata: {
        base44_app_id: Deno.env.get('BASE44_APP_ID'),
        booking_number: bookingData.booking_number,
        customer_email: bookingData.customer_email,
        service_type: bookingData.service_type,
      },
      payment_intent_data: {
        metadata: {
          booking_number: bookingData.booking_number,
          service_type: bookingData.service_type,
        }
      }
    });

    console.log('Checkout session created:', session.id);

    return Response.json({ 
      sessionId: session.id,
      url: session.url 
    });

  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});