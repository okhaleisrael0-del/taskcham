import React, { useState } from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { 
  Mail, Phone, MapPin, Clock, Send, Check
} from 'lucide-react';

export default function ContactPage() {
  const { t } = useLanguage();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitted(true);
    setIsLoading(false);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: t('email'),
      value: 'hello@taskcham.se',
      link: 'mailto:hello@taskcham.se'
    },
    {
      icon: Phone,
      title: t('phoneNumber'),
      value: '+46 769566135',
      link: 'tel:+46769566135'
    },
    {
      icon: MapPin,
      title: t('address'),
      value: t('gothenburgSweden'),
      link: null
    },
    {
      icon: Clock,
      title: t('hours'),
      value: t('monFri'),
      link: null
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative py-24 lg:py-32 bg-gradient-to-br from-slate-50 to-[#E8F4F8] overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#4A90A4]/10 to-[#7FB069]/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6">
              {t('contactTitle')}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('contactSubtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-8">{t('getInTouch')}</h2>
              
              <div className="grid sm:grid-cols-2 gap-6 mb-12">
                {contactInfo.map((item, index) => (
                  <Card key={index} className="border-gray-100">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-[#4A90A4]/10 flex items-center justify-center mb-4">
                        <item.icon className="h-6 w-6 text-[#4A90A4]" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                      {item.link ? (
                        <a href={item.link} className="text-gray-600 hover:text-[#4A90A4] transition-colors">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-gray-600 whitespace-pre-line">{item.value}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Map Placeholder */}
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <iframe
                  title="Gothenburg Map"
                  src="https://www.openstreetmap.org/export/embed.html?bbox=11.9%2C57.68%2C12.05%2C57.72&layer=mapnik"
                  className="w-full h-[300px] border-0"
                ></iframe>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  {isSubmitted ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                        <Check className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('messageSent')}</h3>
                      <p className="text-gray-600">
                        {t('thankYouMessage')}
                      </p>
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('sendMessage')}</h2>
                      
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name">{t('fullName')}</Label>
                            <Input
                              id="name"
                              value={formData.name}
                              onChange={(e) => setFormData({...formData, name: e.target.value})}
                              className="mt-1"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="email">{t('email')}</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                              className="mt-1"
                              required
                            />
                          </div>
                        </div>
                        
                        <div>
                          <Label htmlFor="subject">{t('subject')}</Label>
                          <Input
                            id="subject"
                            value={formData.subject}
                            onChange={(e) => setFormData({...formData, subject: e.target.value})}
                            className="mt-1"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="message">{t('yourMessage')}</Label>
                          <Textarea
                            id="message"
                            rows={5}
                            value={formData.message}
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                            className="mt-1"
                            required
                          />
                        </div>
                        
                        <Button 
                          type="submit" 
                          className="w-full bg-[#4A90A4] hover:bg-[#3d7a8c] rounded-full h-12"
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              {t('sending')}
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Send className="h-5 w-5" />
                              {t('sendMessage')}
                            </span>
                          )}
                        </Button>
                      </form>
                    </>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}