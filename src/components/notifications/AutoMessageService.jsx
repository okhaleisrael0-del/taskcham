import { base44 } from '@/api/base44Client';

export const AutoMessageService = {
  // Customer messages
  async sendPaymentConfirmed(booking) {
    await base44.entities.ChatMessage.create({
      booking_id: booking.id,
      booking_number: booking.booking_number,
      sender_type: 'admin',
      sender_name: 'TaskCham',
      message: `✔ Din TaskCham-bokning är bekräftad.\nVi tilldelar nu en runner till ditt uppdrag.`
    });
  },

  async sendRunnerAccepted(booking, driver) {
    await base44.entities.ChatMessage.create({
      booking_id: booking.id,
      booking_number: booking.booking_number,
      sender_type: 'admin',
      sender_name: 'TaskCham',
      message: `🚗 ${driver.name} är på väg till upphämtningsstället.\n\n📞 Kontakt: ${driver.phone || 'Finns tillgängligt via chatten'}`
    });
  },

  async sendArrivedAtStore(booking) {
    const orderInfo = booking.store_booking_number 
      ? `\nOrdernummer: ${booking.store_booking_number}` 
      : '';
    
    await base44.entities.ChatMessage.create({
      booking_id: booking.id,
      booking_number: booking.booking_number,
      sender_type: 'admin',
      sender_name: 'TaskCham',
      message: `🛒 Din beställning hämtas nu.${orderInfo}`
    });
  },

  async sendOnTheWay(booking) {
    await base44.entities.ChatMessage.create({
      booking_id: booking.id,
      booking_number: booking.booking_number,
      sender_type: 'admin',
      sender_name: 'TaskCham',
      message: `📦 Din leverans är på väg till dig.`
    });
  },

  async sendDelivered(booking) {
    await base44.entities.ChatMessage.create({
      booking_id: booking.id,
      booking_number: booking.booking_number,
      sender_type: 'admin',
      sender_name: 'TaskCham',
      message: `✔ Levererat.\nTack för att du använde TaskCham! 🎉`
    });
  },

  // Runner messages
  async sendNewJobAvailable(booking, driver) {
    await base44.entities.ChatMessage.create({
      booking_id: booking.id,
      booking_number: booking.booking_number,
      sender_type: 'admin',
      sender_name: 'TaskCham',
      sender_id: driver.id,
      message: `📢 Nytt uppdrag tillgängligt nära dig.\n\nPlats: ${booking.pickup_address || booking.task_location}\nBetalning: ${booking.total_price} kr (du får ${booking.driver_earnings} kr)`
    });
  },

  async sendJobAccepted(booking, driver) {
    const storeName = booking.pickup_store?.name || '';
    const location = storeName || booking.pickup_address || booking.task_location;
    const orderInfo = booking.store_booking_number 
      ? `\nOrdernummer: ${booking.store_booking_number}` 
      : '';
    
    await base44.entities.ChatMessage.create({
      booking_id: booking.id,
      booking_number: booking.booking_number,
      sender_type: 'admin',
      sender_name: 'TaskCham',
      sender_id: driver.id,
      message: `🗺 Navigera till upphämtning: ${location}${orderInfo}\n\n📍 Adress: ${booking.pickup_address || booking.task_location}`
    });
  },

  // Trigger automatic messages based on status change
  async handleStatusChange(booking, newStatus, driver = null) {
    try {
      switch(newStatus) {
        case 'assigned':
          if (driver) {
            await this.sendRunnerAccepted(booking, driver);
            await this.sendJobAccepted(booking, driver);
          }
          break;
        
        case 'on_the_way':
          await this.sendArrivedAtStore(booking);
          break;
        
        case 'picked_up':
          await this.sendOnTheWay(booking);
          break;
        
        case 'completed':
          await this.sendDelivered(booking);
          break;
      }
    } catch (error) {
      console.error('Error sending auto message:', error);
    }
  }
};