import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    // Admin-only function
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all bookings
    const bookings = await base44.asServiceRole.entities.Booking.list();
    const flaggedCount = {
      duplicate: 0,
      unpaid: 0,
      abandoned: 0
    };

    // Check for duplicates (same customer, similar details within 1 hour)
    const duplicates = new Map();
    for (const booking of bookings) {
      const key = `${booking.customer_email}_${booking.pickup_address}_${booking.delivery_address}`;
      if (duplicates.has(key)) {
        const existing = duplicates.get(key);
        const timeDiff = Math.abs(new Date(booking.created_date) - new Date(existing.created_date));
        if (timeDiff < 3600000) { // Within 1 hour
          // Check if not already flagged
          const existingFlags = await base44.asServiceRole.entities.BookingFlag.filter({ booking_id: booking.id });
          if (existingFlags.length === 0) {
            await base44.asServiceRole.entities.BookingFlag.create({
              booking_id: booking.id,
              booking_number: booking.booking_number,
              flag_type: 'duplicate',
              reason: `Möjlig duplikat av uppdrag #${existing.booking_number}`,
              flagged_by: 'system',
              auto_flagged: true
            });
            flaggedCount.duplicate++;
          }
        }
      } else {
        duplicates.set(key, booking);
      }
    }

    // Check for unpaid bookings older than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 3600000);
    for (const booking of bookings) {
      if (booking.payment_status === 'pending' && new Date(booking.created_date) < oneDayAgo) {
        const existingFlags = await base44.asServiceRole.entities.BookingFlag.filter({ booking_id: booking.id });
        if (existingFlags.length === 0) {
          await base44.asServiceRole.entities.BookingFlag.create({
            booking_id: booking.id,
            booking_number: booking.booking_number,
            flag_type: 'unpaid',
            reason: 'Obetald efter 24 timmar',
            flagged_by: 'system',
            auto_flagged: true
          });
          flaggedCount.unpaid++;
        }
      }
    }

    // Check for abandoned bookings (pending status for more than 48 hours)
    const twoDaysAgo = new Date(Date.now() - 48 * 3600000);
    for (const booking of bookings) {
      if (booking.status === 'pending' && new Date(booking.created_date) < twoDaysAgo) {
        const existingFlags = await base44.asServiceRole.entities.BookingFlag.filter({ booking_id: booking.id });
        if (existingFlags.length === 0) {
          await base44.asServiceRole.entities.BookingFlag.create({
            booking_id: booking.id,
            booking_number: booking.booking_number,
            flag_type: 'abandoned',
            reason: 'Ingen aktivitet på 48 timmar',
            flagged_by: 'system',
            auto_flagged: true
          });
          flaggedCount.abandoned++;
        }
      }
    }

    return Response.json({
      success: true,
      flagged: flaggedCount,
      total: flaggedCount.duplicate + flaggedCount.unpaid + flaggedCount.abandoned
    });

  } catch (error) {
    console.error('Error in autoFlagBookings:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});