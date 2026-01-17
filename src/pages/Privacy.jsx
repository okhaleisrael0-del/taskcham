import React from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

export default function PrivacyPage() {
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
              <Shield className="h-4 w-4" />
              Legal
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              {t('privacyPolicy')}
            </h1>
            <p className="text-gray-500">Last updated: January 2025</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <h2>1. Introduction</h2>
            <p>
              TaskCham ("we", "our", "us") is committed to protecting your personal data and respecting your privacy. 
              This Privacy Policy explains how we collect, use, and protect your information in compliance with the 
              General Data Protection Regulation (GDPR) and Swedish data protection laws.
            </p>

            <h2>2. Data Controller</h2>
            <p>
              TaskCham, based in Gothenburg, Sweden, is the data controller responsible for your personal data.
            </p>

            <h2>3. Information We Collect</h2>
            <p>We collect the following types of personal data:</p>
            <ul>
              <li><strong>Contact Information:</strong> Name, email address, phone number, and address</li>
              <li><strong>Booking Information:</strong> Service details, locations, dates, and preferences</li>
              <li><strong>Driver/Helper Information:</strong> Application details, vehicle information, service areas</li>
              <li><strong>Usage Data:</strong> How you interact with our services</li>
            </ul>

            <h2>4. How We Use Your Data</h2>
            <p>We use your personal data to:</p>
            <ul>
              <li>Process and fulfill your bookings</li>
              <li>Communicate with you about your services</li>
              <li>Match you with appropriate drivers/helpers</li>
              <li>Improve our services</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>5. Legal Basis for Processing</h2>
            <p>We process your data based on:</p>
            <ul>
              <li><strong>Contract:</strong> To fulfill our service agreement with you</li>
              <li><strong>Consent:</strong> Where you have given explicit consent</li>
              <li><strong>Legitimate Interest:</strong> To improve and protect our services</li>
              <li><strong>Legal Obligation:</strong> To comply with applicable laws</li>
            </ul>

            <h2>6. Data Sharing</h2>
            <p>We share your data only with:</p>
            <ul>
              <li>Drivers and helpers assigned to your task (limited to necessary information)</li>
              <li>Service providers who help us operate our platform</li>
              <li>Authorities when required by law</li>
            </ul>
            <p>We never sell your personal data to third parties.</p>

            <h2>7. Data Retention</h2>
            <p>
              We retain your personal data only as long as necessary to fulfill the purposes for which it was collected, 
              typically for the duration of your use of our services plus any required retention period for legal or 
              business purposes.
            </p>
            <p>
              <strong>Important:</strong> Customer contact information is hidden from drivers/helpers after task completion 
              to protect your privacy.
            </p>

            <h2>8. Your Rights</h2>
            <p>Under GDPR, you have the right to:</p>
            <ul>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Restrict or object to processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>

            <h2>9. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal data against 
              unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2>10. Contact Us</h2>
            <p>
              For any questions about this Privacy Policy or to exercise your rights, please contact us at:
            </p>
            <p>
              Email: privacy@taskcham.se<br />
              Address: Gothenburg, Sweden
            </p>

            <h2>11. Supervisory Authority</h2>
            <p>
              You have the right to lodge a complaint with the Swedish Authority for Privacy Protection 
              (Integritetsskyddsmyndigheten, IMY) if you believe your data protection rights have been violated.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}