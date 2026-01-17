import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Create a notification for a user
 * Can be called from other backend functions or automations
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { 
      user_email,
      user_id,
      title,
      message,
      type = 'system',
      related_booking_id,
      related_booking_number,
      action_url,
      priority = 'normal'
    } = await req.json();

    if (!user_email || !title || !message) {
      return Response.json({ 
        error: 'Missing required fields: user_email, title, message' 
      }, { status: 400 });
    }

    // Create notification
    const notification = await base44.asServiceRole.entities.Notification.create({
      user_email,
      user_id,
      title,
      message,
      type,
      related_booking_id,
      related_booking_number,
      action_url,
      priority,
      is_read: false
    });

    return Response.json({ 
      success: true, 
      notification_id: notification.id 
    });

  } catch (error) {
    console.error('Create notification error:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});