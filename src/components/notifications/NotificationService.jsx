import { base44 } from '@/api/base44Client';

/**
 * Notification Service för TaskCham
 * Hanterar e-post- och SMS-aviseringar för viktiga händelser
 */

const sendSMS = async (to, message) => {
  try {
    await base44.functions.invoke('sendSMS', { to, message });
  } catch (error) {
    console.error('SMS sending failed:', error);
  }
};

export const NotificationService = {
  // Helper to create in-app notification
  async createInAppNotification({ user_email, title, message, type, related_booking_id, related_booking_number, priority = 'normal' }) {
    try {
      await base44.functions.invoke('createNotification', {
        user_email,
        title,
        message,
        type,
        related_booking_id,
        related_booking_number,
        priority
      });
    } catch (error) {
      console.error('Failed to create in-app notification:', error);
    }
  },

  // Notify customer that admin accepted their price offer
  notifyCustomerPriceAccepted: async (booking) => {
    await base44.integrations.Core.SendEmail({
      to: booking.customer_email,
      subject: `✅ Ditt pris godkänt - #${booking.booking_number}`,
      body: `
        <html>
          <body style="font-family: Arial; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center;">
              <h1>✅ Pris Godkänt!</h1>
            </div>
            <div style="background: white; padding: 30px; border: 1px solid #ddd; border-top: none;">
              <p>Hej ${booking.customer_name}!</p>
              <p>Goda nyheter! Vi accepterar ditt prisförslag för uppdrag <strong>#${booking.booking_number}</strong>.</p>
              
              <div style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 28px; font-weight: bold; color: #16a34a;">${booking.customer_offered_price} kr</p>
              </div>

              <p><strong>Nästa steg:</strong> Logga in på TaskCham för att slutföra betalningen så tilldelar vi en runner direkt!</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${typeof window !== 'undefined' ? window.location.origin : 'https://taskcham.se'}" style="background: #22c55e; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  Betala Nu
                </a>
              </div>
            </div>
          </body>
        </html>
      `
    });
  },
  /**
   * Skicka notis till förare när de tilldelas en bokning
   */
  notifyDriverAssigned: async (driver, booking) => {
    try {
      await base44.integrations.Core.SendEmail({
        to: driver.email,
        subject: `Nytt uppdrag tilldelat - #${booking.booking_number}`,
        body: `
Hej ${driver.name}!

Du har tilldelats ett nytt uppdrag i TaskCham.

📦 Bokningsnummer: #${booking.booking_number}
📅 Datum: ${booking.preferred_date}
⏰ Tid: ${booking.preferred_time || 'Ej specificerad'}
💰 Belopp: ${booking.total_price} SEK

${booking.pickup_address ? `📍 Upphämtning: ${booking.pickup_address}` : ''}
${booking.delivery_address ? `🎯 Leverans: ${booking.delivery_address}` : ''}
${booking.task_location ? `📍 Plats: ${booking.task_location}` : ''}

👤 Kund: ${booking.customer_name}
📞 Telefon: ${booking.customer_phone}

📱 Logga in på din förarpanel för att se fullständig information och uppdatera status.

Lycka till med uppdraget!

Med vänliga hälsningar,
TaskCham Team
        `
      });

      // Send SMS to driver
      const smsMessage = `🚗 TaskCham: Nytt uppdrag #${booking.booking_number}! ${booking.total_price} SEK. Logga in för detaljer.`;
      await sendSMS(driver.phone, smsMessage);
    } catch (error) {
      console.error('Failed to send driver assignment notification:', error);
    }
  },

  /**
   * Skicka notis till kund när uppdragsstatus ändras
   */
  notifyStatusChange: async (booking, newStatus) => {
    const statusMessages = {
      assigned: {
        subject: `✅ Förare tilldelad - Bokning #${booking.booking_number}`,
        body: `
Hej ${booking.customer_name}!

Din bokning har tilldelats en förare.

📦 Bokningsnummer: #${booking.booking_number}
👤 Förare: ${booking.assigned_driver_name}
📅 Planerat datum: ${booking.preferred_date}

Du kommer att få fler uppdateringar när uppdraget fortskrider.

Med vänliga hälsningar,
TaskCham Team
        `
      },
      on_the_way: {
        subject: `🚗 Föraren är på väg - Bokning #${booking.booking_number}`,
        body: `
Hej ${booking.customer_name}!

Din förare är nu på väg till upphämtningsplatsen!

📦 Bokningsnummer: #${booking.booking_number}
👤 Förare: ${booking.assigned_driver_name}
📱 Telefon: ${booking.assigned_driver_phone || 'Se appen'}

Du kan spåra föraren i realtid via TaskCham-appen.

Med vänliga hälsningar,
TaskCham Team
        `
      },
      picked_up: {
        subject: `📦 Upphämtat - Föraren är på väg till dig!`,
        body: `
Hej ${booking.customer_name}!

Ditt paket/uppdrag har hämtats upp och föraren är nu på väg till dig!

📦 Bokningsnummer: #${booking.booking_number}
👤 Förare: ${booking.assigned_driver_name}
📍 Spåra i realtid via appen

Beräknad ankomst: ${booking.estimated_arrival_time ? new Date(booking.estimated_arrival_time).toLocaleTimeString('sv-SE', {hour: '2-digit', minute: '2-digit'}) : 'Snart'}

Med vänliga hälsningar,
TaskCham Team
        `
      },
      in_progress: {
        subject: `Leverans påbörjad - Bokning #${booking.booking_number}`,
        body: `
Hej ${booking.customer_name}!

Din leverans är nu på väg!

📦 Bokningsnummer: #${booking.booking_number}
👤 Förare: ${booking.assigned_driver_name}

Med vänliga hälsningar,
TaskCham Team
        `
      },
      completed: {
        subject: `Uppdrag slutfört - Bokning #${booking.booking_number}`,
        body: `
Hej ${booking.customer_name}!

Ditt uppdrag är nu slutfört!

📦 Bokningsnummer: #${booking.booking_number}
👤 Förare: ${booking.assigned_driver_name}
💰 Totalt: ${booking.total_price} SEK

Tack för att du använde TaskCham! Vi hoppas att du är nöjd med servicen.

Med vänliga hälsningar,
TaskCham Team
        `
      }
    };

    const notification = statusMessages[newStatus];
    if (!notification) return;

    try {
      await base44.integrations.Core.SendEmail({
        to: booking.customer_email,
        subject: notification.subject,
        body: notification.body
      });

      // Send SMS for key status changes
      if (newStatus === 'assigned' && booking.customer_phone) {
        const smsMessage = `✅ TaskCham: ${booking.assigned_driver_name} är tilldelad ditt uppdrag #${booking.booking_number}`;
        await sendSMS(booking.customer_phone, smsMessage);
      } else if (newStatus === 'on_the_way' && booking.customer_phone) {
        const smsMessage = `🚗 TaskCham: ${booking.assigned_driver_name} är på väg! Spåra i appen. #${booking.booking_number}`;
        await sendSMS(booking.customer_phone, smsMessage);
      } else if (newStatus === 'picked_up' && booking.customer_phone) {
        const smsMessage = `📦 TaskCham: Upphämtat! ${booking.assigned_driver_name} är nu på väg till dig. Spåra i appen. #${booking.booking_number}`;
        await sendSMS(booking.customer_phone, smsMessage);
      } else if (newStatus === 'in_progress' && booking.customer_phone) {
        const smsMessage = `🏃 TaskCham: Uppdraget pågår. Spåra i realtid! #${booking.booking_number}`;
        await sendSMS(booking.customer_phone, smsMessage);
      } else if (newStatus === 'completed' && booking.customer_phone) {
        const smsMessage = `✅ TaskCham: Uppdrag #${booking.booking_number} slutfört! Betygsätt din upplevelse.`;
        await sendSMS(booking.customer_phone, smsMessage);
      }

      // Create in-app notification for customer
      const notificationTitles = {
        assigned: `Förare tilldelad`,
        on_the_way: `Föraren är på väg`,
        picked_up: `Upphämtat`,
        in_progress: `På väg till dig`,
        completed: `Uppdrag slutfört`
      };

      const notificationMessages = {
        assigned: `${booking.assigned_driver_name} är tilldelad ditt uppdrag`,
        on_the_way: `${booking.assigned_driver_name} är på väg till upphämtning`,
        picked_up: `Uppdraget är upphämtat och på väg till dig`,
        in_progress: `${booking.assigned_driver_name} är på väg till dig`,
        completed: `Ditt uppdrag är slutfört! Tack för att du använder TaskCham`
      };

      if (notificationTitles[newStatus]) {
        await this.createInAppNotification({
          user_email: booking.customer_email,
          title: notificationTitles[newStatus],
          message: notificationMessages[newStatus],
          type: 'booking_update',
          related_booking_id: booking.id,
          related_booking_number: booking.booking_number,
          priority: ['assigned', 'on_the_way', 'in_progress'].includes(newStatus) ? 'high' : 'normal'
        });
      }
    } catch (error) {
      console.error('Failed to send status change notification:', error);
    }
  },

  /**
   * Skicka notis till förare när utbetalning är klar
   */
  notifyPayoutProcessed: async (payout, status) => {
    const messages = {
      completed: {
        subject: '✅ Utbetalning godkänd',
        body: `
Hej ${payout.driver_name}!

Din utbetalningsbegäran har godkänts och behandlas.

💰 Belopp: ${payout.amount} SEK
💳 Metod: ${payout.payment_method === 'bank_transfer' ? 'Banköverföring' : 'Swish'}
📅 Behandlad: ${new Date().toLocaleDateString('sv-SE')}

${payout.notes ? `📝 Meddelande: ${payout.notes}` : ''}

Pengarna kommer att skickas till ditt angivna konto inom 1-3 bankdagar.

Med vänliga hälsningar,
TaskCham Team
        `
      },
      rejected: {
        subject: '❌ Utbetalning avvisad',
        body: `
Hej ${payout.driver_name}!

Din utbetalningsbegäran har tyvärr avvisats.

💰 Belopp: ${payout.amount} SEK
📅 Behandlad: ${new Date().toLocaleDateString('sv-SE')}

${payout.notes ? `📝 Anledning: ${payout.notes}` : ''}

Beloppet har återförts till ditt tillgängliga saldo. Om du har frågor, kontakta support.

Med vänliga hälsningar,
TaskCham Team
        `
      }
    };

    const notification = messages[status];
    if (!notification) return;

    try {
      await base44.integrations.Core.SendEmail({
        to: payout.driver_email,
        subject: notification.subject,
        body: notification.body
      });
      
      // Send SMS notification for payout
      try {
        const drivers = await base44.entities.Driver.filter({ email: payout.driver_email });
        if (drivers && drivers[0]?.phone) {
          const smsMessage = status === 'completed' 
            ? `💰 TaskCham: Din utbetalning på ${payout.amount?.toFixed(0)} SEK har genomförts! Pengarna kommer inom 1-3 dagar.`
            : `❌ TaskCham: Din utbetalning på ${payout.amount?.toFixed(0)} SEK har avvisats. Kontakta support.`;
          await sendSMS(drivers[0].phone, smsMessage);
        }
      } catch (smsError) {
        console.error('Failed to send payout SMS:', smsError);
      }

      // Create in-app notification for driver
      await this.createInAppNotification({
        user_email: payout.driver_email,
        title: status === 'completed' ? 'Utbetalning genomförd' : 'Utbetalning avvisad',
        message: status === 'completed' 
          ? `${payout.amount} kr har betalats ut till ditt konto`
          : `Din utbetalning på ${payout.amount} kr har avvisats. ${payout.notes || ''}`,
        type: 'payment',
        priority: 'high'
      });
    } catch (error) {
      console.error('Failed to send payout notification:', error);
    }
  },

  /**
   * Skicka notis om nytt chattmeddelande
   */
  notifyChatMessage: async (booking, message, recipientEmail, recipientName) => {
    try {
      await base44.integrations.Core.SendEmail({
        to: recipientEmail,
        subject: `💬 Nytt meddelande - Bokning #${booking.booking_number}`,
        body: `
Hej ${recipientName}!

Du har fått ett nytt meddelande angående bokning #${booking.booking_number}.

💬 Från: ${message.sender_name}
📝 Meddelande: ${message.message}

Logga in för att svara och se fullständig konversation.

Med vänliga hälsningar,
TaskCham Team
        `
      });
    } catch (error) {
      console.error('Failed to send chat notification:', error);
    }
  },

  /**
   * Välkomstmail till ny förare när godkänd
   */
  notifyDriverApproved: async (driver) => {
    const emailBody = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4A90A4 0%, #7FB069 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
            .welcome-box { background: #f0f9ff; border-left: 4px solid #4A90A4; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .cta-button { display: inline-block; background: #4A90A4; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: bold; }
            .steps { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .steps h3 { color: #4A90A4; margin-top: 0; }
            .steps ol { padding-left: 20px; }
            .steps li { margin: 10px 0; }
            .footer { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; text-align: center; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🎉 Välkommen till TaskCham!</h1>
          </div>
          <div class="content">
            <div class="welcome-box">
              <h2 style="margin-top: 0; color: #4A90A4;">Du är nu godkänd som TaskCham Runner!</h2>
              <p style="font-size: 16px; margin: 0;">Hej ${driver.name},</p>
              <p style="font-size: 16px;">Grattis! Du är nu godkänd och kan börja acceptera jobb i Göteborg.</p>
            </div>

            <div class="steps">
              <h3>Så här kommer du igång:</h3>
              <ol>
                <li><strong>Logga in på TaskCham</strong> - Använd dina inloggningsuppgifter</li>
                <li><strong>Gå till Runner Dashboard</strong> - Klicka på "Gå Online" för att börja</li>
                <li><strong>Se tillgängliga jobb</strong> - Välj de uppdrag som passar dig</li>
                <li><strong>Börja tjäna pengar</strong> - 80% av varje uppdrag går till dig!</li>
              </ol>
            </div>

            <p style="font-size: 16px;"><strong>Din status:</strong></p>
            <ul>
              <li>✅ Godkänd som Runner</li>
              <li>✅ Dashboard aktiverad</li>
              <li>✅ Kan gå online och acceptera jobb</li>
              <li>✅ Full tillgång till chatt, navigation och intäkter</li>
            </ul>

            <p style="font-size: 16px;">Logga in nu och börja tjäna pengar genom att hjälpa människor i Göteborg!</p>

            <center>
              <a href="https://taskcham.base44.app" class="cta-button">Logga in och börja jobba →</a>
            </center>

            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              <strong>Kontakt:</strong><br>
              Email: info@taskcham.se<br>
              Telefon: +46 76 956 61 35
            </p>
          </div>
          <div class="footer">
            <p>TaskCham - Din Lokala Hjälp i Göteborg</p>
            <p>Du får detta mail för att du är godkänd som TaskCham Runner.</p>
          </div>
        </body>
      </html>
    `;

    try {
      // Send welcome email
      await base44.integrations.Core.SendEmail({
        to: driver.email,
        subject: '🎉 Du är nu TaskCham Runner - Börja jobba idag!',
        body: emailBody
      });
      console.log(`Welcome email sent to ${driver.email}`);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    // Send SMS notification
    if (driver.phone) {
      try {
        const smsMessage = `Du är nu godkänd som TaskCham runner! Logga in och gå online för att börja ta jobb. Välkommen till teamet!`;
        
        await sendSMS(driver.phone, smsMessage);
        console.log(`Welcome SMS sent to ${driver.phone}`);
      } catch (error) {
        console.error('Failed to send welcome SMS:', error);
      }
    }
  },

  /**
   * Notis till kund när ny bokning skapas
   */
  notifyBookingConfirmation: async (booking) => {
    try {
      await base44.integrations.Core.SendEmail({
        to: booking.customer_email,
        subject: `Bokningsbekräftelse - #${booking.booking_number}`,
        body: `
Hej ${booking.customer_name}!

Tack för din bokning hos TaskCham!

📦 Bokningsnummer: #${booking.booking_number}
📅 Datum: ${booking.preferred_date}
⏰ Tid: ${booking.preferred_time || 'Flexibel'}
💰 Totalt pris: ${booking.total_price} SEK

${booking.pickup_address ? `📍 Upphämtning: ${booking.pickup_address}` : ''}
${booking.delivery_address ? `🎯 Leverans: ${booking.delivery_address}` : ''}
${booking.task_location ? `📍 Plats: ${booking.task_location}` : ''}

📝 Beskrivning: ${booking.item_description || 'Ej angiven'}

Vi tilldelar en förare så snart som möjligt och du kommer att få en uppdatering.

Med vänliga hälsningar,
TaskCham Team
        `
      });
      // Send SMS confirmation to customer
      const smsMessage = `✅ TaskCham: Din bokning #${booking.booking_number} är bekräftad! Vi tilldelar en runner snart.`;
      await sendSMS(booking.customer_phone, smsMessage);

      // Create in-app notification
      await this.createInAppNotification({
        user_email: booking.customer_email,
        title: 'Bokning bekräftad',
        message: `Din bokning #${booking.booking_number} är mottagen. Vi tilldelar en runner snart!`,
        type: 'booking_update',
        related_booking_id: booking.id,
        related_booking_number: booking.booking_number,
        priority: 'normal'
      });
    } catch (error) {
      console.error('Failed to send booking confirmation:', error);
    }
  },

  /**
   * Skicka notis till admin vid problem
   */
  /**
   * Skicka notis när förare anländer
   */
  notifyDriverArrived: async (booking) => {
    try {
      await base44.integrations.Core.SendEmail({
        to: booking.customer_email,
        subject: `🎯 Föraren har anlänt - #${booking.booking_number}`,
        body: `
Hej ${booking.customer_name}!

${booking.assigned_driver_name} har nu anlänt till ${booking.service_type === 'delivery' ? 'leveransadressen' : 'platsen'}.

📦 Bokningsnummer: #${booking.booking_number}
👤 Förare: ${booking.assigned_driver_name}
📱 Telefon: ${booking.assigned_driver_phone || 'Se appen'}

Med vänliga hälsningar,
TaskCham Team
        `
      });

      // Send SMS
      if (booking.customer_phone) {
        const smsMessage = `🎯 TaskCham: ${booking.assigned_driver_name} har anlänt! #${booking.booking_number}`;
        await sendSMS(booking.customer_phone, smsMessage);
      }
    } catch (error) {
      console.error('Failed to send arrival notification:', error);
    }
  },

  notifyProblem: async (booking, issue) => {
    try {
      const adminUsers = await base44.entities.User.filter({ role: 'admin' });
      
      for (const admin of adminUsers) {
        await base44.integrations.Core.SendEmail({
          to: admin.email,
          subject: `⚠️ Problem med uppdrag #${booking.booking_number}`,
          body: `
<h2>Problem Rapporterat</h2>
<p><strong>Uppdrag:</strong> #${booking.booking_number}</p>
<p><strong>Problem:</strong> ${issue}</p>
<p><strong>Kund:</strong> ${booking.customer_name} (${booking.customer_phone})</p>
<p><strong>Förare:</strong> ${booking.assigned_driver_name || 'Ej tilldelad'}</p>
<p>Åtgärd krävs omgående.</p>
          `
        });
      }
    } catch (error) {
      console.error('Failed to notify problem:', error);
    }
  }
};