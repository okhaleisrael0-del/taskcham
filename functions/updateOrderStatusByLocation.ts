import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Haversine formula to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId, currentLat, currentLng } = await req.json();

    if (!orderId || !currentLat || !currentLng) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Get the order
    const order = await base44.asServiceRole.entities.BuyDeliverOrder.filter({ id: orderId });
    if (!order || order.length === 0) {
      return Response.json({ error: 'Order not found' }, { status: 404 });
    }

    const currentOrder = order[0];
    let newStatus = null;
    let notification = null;

    // Calculate distances
    const storeDistance = currentOrder.store_lat && currentOrder.store_lng
      ? calculateDistance(currentLat, currentLng, currentOrder.store_lat, currentOrder.store_lng)
      : null;

    const deliveryDistance = currentOrder.delivery_lat && currentOrder.delivery_lng
      ? calculateDistance(currentLat, currentLng, currentOrder.delivery_lat, currentOrder.delivery_lng)
      : null;

    console.log(`Order ${currentOrder.order_number} - Store distance: ${storeDistance}km, Delivery distance: ${deliveryDistance}km`);

    // Auto-status logic
    if (currentOrder.status === 'assigned' && storeDistance !== null && storeDistance < 0.5) {
      // Runner is within 500m of store - auto-mark as shopping
      newStatus = 'shopping';
      notification = {
        message: 'Runner har anlänt till butiken och börjar handla',
        type: 'store_arrival'
      };
    } else if (currentOrder.status === 'purchased' && deliveryDistance !== null && deliveryDistance < 0.5) {
      // Runner is within 500m of delivery - auto-mark as delivering
      newStatus = 'delivering';
      notification = {
        message: 'Runner är nära leveransplatsen',
        type: 'near_delivery'
      };
    } else if (currentOrder.status === 'delivering' && deliveryDistance !== null && deliveryDistance < 0.05) {
      // Runner is within 50m of delivery - prompt for completion
      notification = {
        message: 'Du är framme! Markera som levererad när kunden har fått varorna.',
        type: 'at_delivery'
      };
    }

    // Update order if status changed
    if (newStatus) {
      await base44.asServiceRole.entities.BuyDeliverOrder.update(currentOrder.id, {
        status: newStatus,
        runner_current_lat: currentLat,
        runner_current_lng: currentLng,
        last_location_update: new Date().toISOString()
      });

      // Send SMS to customer
      if (notification && notification.type === 'near_delivery') {
        await base44.asServiceRole.functions.invoke('sendSMS', {
          to: currentOrder.customer_phone,
          message: `TaskCham: Din Köp & Leverera beställning #${currentOrder.order_number} är på väg! Runner är nära leveransplatsen. 🚗📦`
        });
      }

      console.log(`✓ Auto-updated order ${currentOrder.order_number} to status: ${newStatus}`);
    } else {
      // Just update location
      await base44.asServiceRole.entities.BuyDeliverOrder.update(currentOrder.id, {
        runner_current_lat: currentLat,
        runner_current_lng: currentLng,
        last_location_update: new Date().toISOString()
      });
    }

    return Response.json({
      success: true,
      statusChanged: !!newStatus,
      newStatus,
      notification,
      distances: { storeDistance, deliveryDistance }
    });

  } catch (error) {
    console.error('Error updating order status:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});