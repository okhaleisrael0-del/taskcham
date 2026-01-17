import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, message } = await req.json();

    if (!to || !message) {
      return Response.json({ error: 'Missing required fields: to, message' }, { status: 400 });
    }

    // Get Twilio credentials from environment
    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const fromNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (!accountSid || !authToken || !fromNumber) {
      console.error('Missing Twilio credentials');
      return Response.json({ 
        error: 'SMS service not configured',
        details: 'Twilio credentials missing'
      }, { status: 500 });
    }

    // Format phone number (remove spaces, add + if missing)
    let formattedTo = to.replace(/\s/g, '');
    if (!formattedTo.startsWith('+')) {
      // Assume Swedish number if no country code
      formattedTo = '+46' + formattedTo.replace(/^0/, '');
    }

    // Create Twilio API request
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const body = new URLSearchParams({
      To: formattedTo,
      From: fromNumber,
      Body: message
    });

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twilio API error:', data);
      return Response.json({ 
        error: 'Failed to send SMS',
        details: data.message || 'Unknown error'
      }, { status: 500 });
    }

    console.log('SMS sent successfully:', data.sid);

    return Response.json({ 
      success: true,
      message_sid: data.sid,
      to: formattedTo
    });

  } catch (error) {
    console.error('Error sending SMS:', error);
    return Response.json({ 
      error: error.message 
    }, { status: 500 });
  }
});