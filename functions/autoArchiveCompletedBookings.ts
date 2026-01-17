import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me().catch(() => null);
    if (user && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    console.log('Starting auto-archive job...');

    // Find completed bookings older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const completedBookings = await base44.asServiceRole.entities.Booking.filter({
      status: 'completed'
    });

    let archivedCount = 0;
    const errors = [];

    for (const booking of completedBookings) {
      const completedDate = booking.completed_date 
        ? new Date(booking.completed_date) 
        : new Date(booking.updated_date);

      // Archive if older than 30 days
      if (completedDate < thirtyDaysAgo) {
        try {
          await base44.asServiceRole.functions.invoke('updateBookingStatus', {
            booking_id: booking.id,
            new_status: 'archived',
            reason: 'Auto-archived after 30 days'
          });
          archivedCount++;
          console.log(`Archived booking #${booking.booking_number}`);
        } catch (error) {
          console.error(`Failed to archive booking #${booking.booking_number}:`, error);
          errors.push({
            booking_number: booking.booking_number,
            error: error.message
          });
        }
      }
    }

    console.log(`Auto-archive complete. Archived ${archivedCount} bookings.`);

    return Response.json({
      success: true,
      total_completed: completedBookings.length,
      archived_count: archivedCount,
      errors: errors.length > 0 ? errors : null
    });

  } catch (error) {
    console.error('Auto-archive job error:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
});