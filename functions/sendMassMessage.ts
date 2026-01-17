import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { recipient_type, subject, message, urgent } = await req.json();
    const errors = [];

    console.log('Sending mass message:', { recipient_type, subject, urgent });

    if (!recipient_type || !subject || !message) {
      return Response.json({ 
        error: 'Missing required fields: recipient_type, subject, message' 
      }, { status: 400 });
    }

    let recipients = [];

    // Get recipients based on type
    if (recipient_type === 'all_drivers' || recipient_type === 'active_drivers') {
      const drivers = await base44.asServiceRole.entities.Driver.list('-created_date', 500);
      
      if (recipient_type === 'active_drivers') {
        recipients = drivers
          .filter(d => d.status === 'approved' && d.dashboard_access === 'active')
          .map(d => ({ email: d.email, name: d.name }));
      } else {
        recipients = drivers
          .filter(d => d.status === 'approved')
          .map(d => ({ email: d.email, name: d.name }));
      }
    } else if (recipient_type === 'all_customers') {
      // Get unique customer emails from bookings
      const bookings = await base44.asServiceRole.entities.Booking.list('-created_date', 1000);
      const uniqueCustomers = [...new Set(bookings.map(b => b.customer_email))];
      recipients = uniqueCustomers.map(email => ({ email, name: 'Kund' }));
    } else if (recipient_type === 'admins') {
      const allUsers = await base44.asServiceRole.entities.User.list();
      recipients = allUsers
        .filter(u => u.role === 'admin')
        .map(u => ({ email: u.email, name: u.full_name }));
    } else {
      return Response.json({ error: 'Invalid recipient_type' }, { status: 400 });
    }

    console.log(`Sending to ${recipients.length} recipients`);

    // Create HTML email
    const emailHtml = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${urgent ? '#dc2626' : '#4A90A4'}; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
            .message { white-space: pre-wrap; }
            .urgent { background: #fee; border-left: 4px solid #dc2626; padding: 15px; margin-bottom: 20px; }
            .footer { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${urgent ? '⚠️ ' : ''}${subject}</h1>
          </div>
          <div class="content">
            ${urgent ? '<div class="urgent"><strong>Brådskande meddelande från TaskCham</strong></div>' : ''}
            <div class="message">${message}</div>
          </div>
          <div class="footer">
            <p>TaskCham - Din Lokala Hjälp i Göteborg</p>
            <p>Detta meddelande skickades från TaskCham administration.</p>
          </div>
        </body>
      </html>
    `;

    // Send emails
    const sent = [];
    const failed = [];

    for (const recipient of recipients) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: recipient.email,
          subject: `${urgent ? '⚠️ BRÅDSKANDE - ' : ''}${subject}`,
          body: emailHtml
        });
        sent.push(recipient.email);
        console.log(`Sent to ${recipient.email}`);
      } catch (error) {
        console.error(`Failed to send to ${recipient.email}:`, error);
        failed.push({ email: recipient.email, error: error.message });
        errors.push(`Email till ${recipient.email}: ${error.message}`);
      }
    }

    console.log(`Mass message complete: ${sent.length} sent, ${failed.length} failed`);

    // Log the notification to history
    try {
      await base44.asServiceRole.entities.MassNotificationLog.create({
        message_content: message,
        target_group: recipient_type,
        delivery_methods: ['email'],
        recipient_count: recipients.length,
        recipient_ids: [],
        recipient_names: recipients.map(r => r.name || r.email),
        sent_by: user.full_name,
        sent_by_email: user.email,
        success: failed.length === 0,
        errors: errors.length > 0 ? errors : undefined
      });
    } catch (logError) {
      console.error('Failed to log notification:', logError);
    }

    return Response.json({
      success: true,
      sent_count: sent.length,
      failed_count: failed.length,
      recipient_type,
      sent_to: sent,
      failed: failed
    });

  } catch (error) {
    console.error('Mass message error:', error);
    
    // Log failed notification
    try {
      const user = await base44.auth.me();
      await base44.asServiceRole.entities.MassNotificationLog.create({
        message_content: message || 'N/A',
        target_group: recipient_type || 'unknown',
        delivery_methods: ['email'],
        recipient_count: 0,
        sent_by: user?.full_name || 'Unknown',
        sent_by_email: user?.email || 'unknown',
        success: false,
        errors: [error.message]
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
    
    return Response.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
});