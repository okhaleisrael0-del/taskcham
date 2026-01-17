import React from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { motion } from 'framer-motion';
import { XCircle } from 'lucide-react';

export default function CancellationPage() {
  const { t } = useLanguage();

  return (
    <div className="bg-white min-h-screen">
      {/* Hero */}
      <section className="py-24 bg-gradient-to-br from-slate-50 to-[#E8F4F8]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A90A4]/10 rounded-full text-[#4A90A4] text-sm font-medium mb-6">
              <XCircle className="h-4 w-4" />
              Legal
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t('cancellationPolicy')}
            </h1>
            <p className="text-gray-500">Last updated: January 2025</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h2>1. Cancellation by Customer</h2>
            
            <h3>Free Cancellation</h3>
            <p>You may cancel your booking free of charge if:</p>
            <ul>
              <li>Cancelled more than 2 hours before the scheduled service time</li>
              <li>No driver/helper has been assigned yet</li>
            </ul>

            <h3>Late Cancellation</h3>
            <p>If you cancel less than 2 hours before the scheduled time:</p>
            <ul>
              <li>A cancellation fee of 50% of the booking value may apply</li>
              <li>If a driver/helper is already on their way, the full amount may be charged</li>
            </ul>

            <h2>2. How to Cancel</h2>
            <p>To cancel a booking, you can:</p>
            <ul>
              <li>Contact us by phone as soon as possible</li>
              <li>Send an email to bookings@taskcham.se</li>
            </ul>
            <p>Please include your booking number when cancelling.</p>

            <h2>3. Cancellation by TaskCham</h2>
            <p>We may cancel a booking if:</p>
            <ul>
              <li>No drivers/helpers are available for your requested time</li>
              <li>Severe weather or unsafe conditions make the service impossible</li>
              <li>The requested service violates our terms</li>
            </ul>
            <p>
              If we cancel, you will receive a full refund or can reschedule at no additional cost.
            </p>

            <h2>4. No-Shows</h2>
            <p>
              If you are not available at the scheduled time and location without prior notice, 
              the full booking amount may be charged.
            </p>

            <h2>5. Refunds</h2>
            <p>
              Refunds for eligible cancellations will be processed within 5-7 business days 
              using the original payment method.
            </p>

            <h2>6. Rescheduling</h2>
            <p>
              You may reschedule your booking free of charge if done more than 2 hours before 
              the scheduled time, subject to availability.
            </p>

            <h2>7. Contact</h2>
            <p>
              For cancellation requests or questions, contact us at:<br />
              Email: bookings@taskcham.se<br />
              Phone: +46 31 XXX XXXX
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}