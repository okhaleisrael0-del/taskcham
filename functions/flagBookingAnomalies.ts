import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { differenceInHours, differenceInMinutes } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    console.log('Starting booking anomaly check');

    // Fetch active and recent bookings
    const bookings = await base44.asServiceRole.entities.Booking.list('-created_date', 500);
    
    const anomalies = [];
    const now = new Date();

    for (const booking of bookings) {
      const createdDate = new Date(booking.created_date);
      const hoursElapsed = differenceInHours(now, createdDate);

      // Check for various anomalies
      
      // 1. Booking stuck in "assigned" for more than 2 hours
      if (booking.status === 'assigned' && hoursElapsed > 2) {
        anomalies.push({
          booking_id: booking.id,
          booking_number: booking.booking_number,
          type: 'stuck_assigned',
          severity: 'medium',
          message: `Bokning har varit "tilldelad" i ${hoursElapsed} timmar utan förändring`,
          customer_email: booking.customer_email,
          driver_name: booking.assigned_driver_name
        });
      }

      // 2. Booking stuck in "picked_up" or "in_progress" for more than 4 hours
      if (['picked_up', 'in_progress'].includes(booking.status) && hoursElapsed > 4) {
        anomalies.push({
          booking_id: booking.id,
          booking_number: booking.booking_number,
          type: 'stuck_progress',
          severity: 'high',
          message: `Bokning har varit "${booking.status}" i ${hoursElapsed} timmar - möjlig försening`,
          customer_email: booking.customer_email,
          driver_name: booking.assigned_driver_name
        });
      }

      // 3. Tracking active but no location update in 30 minutes
      if (booking.tracking_active && booking.last_location_update) {
        const lastUpdate = new Date(booking.last_location_update);
        const minutesSinceUpdate = differenceInMinutes(now, lastUpdate);
        
        if (minutesSinceUpdate > 30) {
          anomalies.push({
            booking_id: booking.id,
            booking_number: booking.booking_number,
            type: 'tracking_stale',
            severity: 'medium',
            message: `Spårning aktiv men ingen platsuppdatering på ${minutesSinceUpdate} minuter`,
            customer_email: booking.customer_email,
            driver_name: booking.assigned_driver_name
          });
        }
      }

      // 4. Payment pending for completed booking more than 24 hours
      if (booking.status === 'completed' && booking.payment_status === 'pending' && hoursElapsed > 24) {
        anomalies.push({
          booking_id: booking.id,
          booking_number: booking.booking_number,
          type: 'payment_pending',
          severity: 'high',
          message: `Slutförd bokning har väntande betalning i ${hoursElapsed} timmar`,
          customer_email: booking.customer_email,
          driver_name: booking.assigned_driver_name,
          amount: booking.total_price
        });
      }

      // 5. Booking without assigned driver for more than 1 hour
      if (booking.status === 'pending' && !booking.assigned_driver_id && hoursElapsed > 1) {
        anomalies.push({
          booking_id: booking.id,
          booking_number: booking.booking_number,
          type: 'unassigned',
          severity: 'high',
          message: `Ingen förare tilldelad på ${hoursElapsed} timmar`,
          customer_email: booking.customer_email,
          driver_name: null
        });
      }
    }

    console.log(`Found ${anomalies.length} anomalies`);

    // If anomalies found, notify admins
    if (anomalies.length > 0) {
      const allUsers = await base44.asServiceRole.entities.User.list();
      const adminUsers = allUsers.filter(u => u.role === 'admin');

      const highSeverity = anomalies.filter(a => a.severity === 'high');
      const mediumSeverity = anomalies.filter(a => a.severity === 'medium');

      const emailHtml = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .high { background: #fee; border-left: 4px solid #dc2626; padding: 15px; margin: 10px 0; }
              .medium { background: #fef3cd; border-left: 4px solid #f59e0b; padding: 15px; margin: 10px 0; }
              h2 { color: #dc2626; }
              .booking-id { font-weight: bold; color: #4A90A4; }
            </style>
          </head>
          <body>
            <h1>⚠️ TaskCham Bokningsavvikelser</h1>
            <p><strong>Tid:</strong> ${new Date().toLocaleString('sv-SE')}</p>
            <p><strong>Totalt:</strong> ${anomalies.length} avvikelser (${highSeverity.length} hög, ${mediumSeverity.length} medium)</p>

            ${highSeverity.length > 0 ? `
              <h2>Hög Prioritet (${highSeverity.length})</h2>
              ${highSeverity.map(a => `
                <div class="high">
                  <p><span class="booking-id">#${a.booking_number}</span></p>
                  <p><strong>Problem:</strong> ${a.message}</p>
                  <p><strong>Kund:</strong> ${a.customer_email}</p>
                  ${a.driver_name ? `<p><strong>Förare:</strong> ${a.driver_name}</p>` : ''}
                  ${a.amount ? `<p><strong>Belopp:</strong> ${a.amount} SEK</p>` : ''}
                </div>
              `).join('')}
            ` : ''}

            ${mediumSeverity.length > 0 ? `
              <h2>Medium Prioritet (${mediumSeverity.length})</h2>
              ${mediumSeverity.map(a => `
                <div class="medium">
                  <p><span class="booking-id">#${a.booking_number}</span></p>
                  <p><strong>Problem:</strong> ${a.message}</p>
                  <p><strong>Kund:</strong> ${a.customer_email}</p>
                  ${a.driver_name ? `<p><strong>Förare:</strong> ${a.driver_name}</p>` : ''}
                </div>
              `).join('')}
            ` : ''}

            <p style="margin-top: 30px; color: #666;">
              Logga in på admin-panelen för att hantera dessa avvikelser.
            </p>
          </body>
        </html>
      `;

      for (const admin of adminUsers) {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: admin.email,
          subject: `⚠️ TaskCham Avvikelser: ${anomalies.length} bokningar behöver granskning`,
          body: emailHtml
        });
      }

      console.log(`Anomaly report sent to ${adminUsers.length} admin(s)`);
    }

    return Response.json({
      success: true,
      anomalies_found: anomalies.length,
      high_severity: anomalies.filter(a => a.severity === 'high').length,
      medium_severity: anomalies.filter(a => a.severity === 'medium').length,
      anomalies: anomalies
    });

  } catch (error) {
    console.error('Anomaly check error:', error);
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});