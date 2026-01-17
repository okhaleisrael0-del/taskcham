import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

// Define valid status transitions
const STATUS_FLOW = {
  draft: ['price_review', 'cancelled'],
  price_review: ['awaiting_payment', 'draft', 'cancelled'],
  awaiting_payment: ['paid', 'cancelled'],
  paid: ['assigned', 'cancelled'],
  assigned: ['picked_up', 'cancelled'],
  picked_up: ['on_the_way', 'cancelled'],
  on_the_way: ['delivered', 'cancelled'],
  delivered: ['completed', 'cancelled'],
  completed: ['archived'],
  archived: [],
  cancelled: []
};

// Notification messages for each status
const STATUS_NOTIFICATIONS = {
  price_review: {
    customer: 'Din bokning granskas. Du får snart ett prisförslag.',
    admin: 'Ny bokning väntar på prisgranskning.'
  },
  awaiting_payment: {
    customer: 'Ditt pris är klart! Betala för att bekräfta din bokning.',
    admin: 'Prisförslag skickat till kund.'
  },
  paid: {
    customer: 'Betalning mottagen! Vi tilldelar snart en runner till ditt uppdrag.',
    admin: 'Betalning mottagen. Tilldela runner.',
    runner: null
  },
  assigned: {
    customer: 'En runner har tilldelats ditt uppdrag!',
    admin: 'Runner tilldelad.',
    runner: 'Du har tilldelats ett nytt uppdrag!'
  },
  picked_up: {
    customer: 'Runner har hämtat dina varor och är på väg!',
    admin: 'Upphämtning bekräftad.',
    runner: null
  },
  on_the_way: {
    customer: 'Din leverans är på väg!',
    admin: 'Leverans pågår.',
    runner: null
  },
  delivered: {
    customer: 'Ditt uppdrag är levererat! Vänligen bekräfta mottagandet.',
    admin: 'Leverans genomförd.',
    runner: 'Leverans genomförd!'
  },
  completed: {
    customer: 'Tack för att du använde TaskCham! Lämna gärna ett omdöme.',
    admin: 'Uppdrag slutfört.',
    runner: 'Uppdrag slutfört! Dina intäkter uppdateras.'
  },
  archived: {
    customer: null,
    admin: 'Uppdrag arkiverat.',
    runner: null
  },
  cancelled: {
    customer: 'Din bokning har avbrutits.',
    admin: 'Bokning avbruten.',
    runner: 'Uppdrag avbrutet.'
  }
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { booking_id, new_status, reason } = await req.json();

    if (!booking_id || !new_status) {
      return Response.json({ error: 'Missing booking_id or new_status' }, { status: 400 });
    }

    // Get current booking
    const bookings = await base44.entities.Booking.filter({ id: booking_id });
    if (bookings.length === 0) {
      return Response.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookings[0];
    const current_status = booking.status;

    // Validate status transition
    const allowedTransitions = STATUS_FLOW[current_status] || [];
    if (!allowedTransitions.includes(new_status)) {
      return Response.json({
        error: 'Invalid status transition',
        message: `Cannot transition from '${current_status}' to '${new_status}'`,
        allowed: allowedTransitions
      }, { status: 400 });
    }

    // Add to status history
    const status_history = booking.status_history || [];
    status_history.push({
      status: new_status,
      timestamp: new Date().toISOString(),
      changed_by: user.email,
      reason: reason || null
    });

    // Prepare update data
    const updateData = {
      status: new_status,
      status_history
    };

    // Add timestamps for completed and archived
    if (new_status === 'completed') {
      updateData.completed_date = new Date().toISOString();
    }
    if (new_status === 'archived') {
      updateData.archived_date = new Date().toISOString();
    }

    // Update booking
    await base44.asServiceRole.entities.Booking.update(booking_id, updateData);

    // Send notifications
    const notifications = STATUS_NOTIFICATIONS[new_status];
    if (notifications) {
      // Customer notification
      if (notifications.customer && booking.customer_email) {
        try {
          await base44.asServiceRole.integrations.Core.SendEmail({
            to: booking.customer_email,
            subject: `TaskCham - Uppdatering om din bokning #${booking.booking_number}`,
            body: `Hej ${booking.customer_name}!\n\n${notifications.customer}\n\nBokning: #${booking.booking_number}\nStatus: ${new_status}\n\nMed vänliga hälsningar,\nTaskCham`
          });

          // SMS notification (optional, skip if fails)
          if (booking.customer_phone) {
            try {
              await base44.asServiceRole.functions.invoke('sendSMS', {
                to: booking.customer_phone,
                message: `TaskCham #${booking.booking_number}: ${notifications.customer}`
              });
            } catch (smsError) {
              console.log('SMS notification skipped (service not configured)');
            }
          }
        } catch (error) {
          console.error('Customer notification error:', error);
        }
      }

      // Runner notification
      if (notifications.runner && booking.assigned_driver_id) {
        try {
          const drivers = await base44.asServiceRole.entities.Driver.filter({ 
            id: booking.assigned_driver_id 
          });
          if (drivers.length > 0) {
            const driver = drivers[0];
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: driver.email,
              subject: `TaskCham - Uppdatering om uppdrag #${booking.booking_number}`,
              body: `Hej ${driver.name}!\n\n${notifications.runner}\n\nBokning: #${booking.booking_number}\n\nMed vänliga hälsningar,\nTaskCham`
            });

            if (driver.phone) {
              try {
                await base44.asServiceRole.functions.invoke('sendSMS', {
                  to: driver.phone,
                  message: `TaskCham #${booking.booking_number}: ${notifications.runner}`
                });
              } catch (smsError) {
                console.log('SMS notification skipped (service not configured)');
              }
            }
          }
        } catch (error) {
          console.error('Runner notification error:', error);
        }
      }

      // Admin notification
      if (notifications.admin) {
        try {
          const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
          for (const admin of admins) {
            await base44.asServiceRole.integrations.Core.SendEmail({
              to: admin.email,
              subject: `TaskCham Admin - Bokning #${booking.booking_number} uppdaterad`,
              body: `${notifications.admin}\n\nBokning: #${booking.booking_number}\nKund: ${booking.customer_name}\nStatus: ${current_status} → ${new_status}\n\nSe detaljer i admin-panelen.`
            });
          }
        } catch (error) {
          console.error('Admin notification error:', error);
        }
      }
    }

    console.log(`Status updated: ${current_status} → ${new_status} for booking ${booking.booking_number}`);

    return Response.json({
      success: true,
      booking_id,
      old_status: current_status,
      new_status,
      notifications_sent: true
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    return Response.json({ 
      error: 'Internal server error',
      message: error.message 
    }, { status: 500 });
  }
});