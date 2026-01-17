import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { 
  Truck, Home, Sun, Snowflake, Heart, Shield, Leaf, 
  MapPin, Clock, Star, ArrowRight, Package, ShoppingBag,
  Dog, Sparkles, Users
} from 'lucide-react';

export default function HomePage() {
  const { t } = useLanguage();

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const services = [
    {
      icon: Sun,
      title: t('summerServices'),
      description: t('summerDesc'),
      color: 'from-amber-400 to-orange-500',
      bgColor: 'bg-amber-50'
    },
    {
      icon: Snowflake,
      title: t('winterServices'),
      description: t('winterDesc'),
      color: 'from-blue-400 to-cyan-500',
      bgColor: 'bg-blue-50'
    }
  ];

  const helpServices = [
    { icon: Dog, title: t('petCare'), desc: t('petCareDesc') },
    { icon: Sparkles, title: t('dishesCleanup'), desc: t('dishesCleanupDesc') },
    { icon: Home, title: t('householdHelp'), desc: t('householdHelpDesc') },
    { icon: ShoppingBag, title: t('storePickup'), desc: t('storePickupDesc') },
    { icon: Package, title: t('parcelReturns'), desc: t('parcelReturnsDesc') },
    { icon: Users, title: t('elderlySupport'), desc: t('elderlySupportDesc') }
  ];

  const values = [
    { icon: Shield, title: t('trust'), desc: t('trustDesc'), color: 'text-[#4A90A4]' },
    { icon: MapPin, title: t('local'), desc: t('localDesc'), color: 'text-[#7FB069]' },
    { icon: Leaf, title: t('eco'), desc: t('ecoDesc'), color: 'text-green-600' }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-[#E8F4F8]" />
          <div className="absolute top-20 right-0 w-[800px] h-[800px] bg-gradient-to-br from-[#4A90A4]/10 to-[#7FB069]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-amber-100/40 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A90A4]/10 rounded-full text-[#4A90A4] text-sm font-medium mb-6">
                <MapPin className="h-4 w-4" />
                {t('location')}
              </div>
              
              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-gray-900 leading-tight mb-6">
                TaskCham – Vi fixar det åt dig
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-xl">
                Göteborgs allt-i-ett-service, i alla väder. Oavsett om det regnar, snöar eller är strålande sol – TaskCham hjälper dig med leveranser och hemhjälp.
              </p>
              
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 1C15.6 1 14.3 1.5 13.3 2.4L4.8 10.9C2.9 12.8 2.9 15.9 4.8 17.8C6.7 19.7 9.8 19.7 11.7 17.8L20.2 9.3C20.9 8.6 21.9 8.6 22.6 9.3C23.3 10 23.3 11 22.6 11.7L14.1 20.2C11.4 22.9 7 22.9 4.3 20.2C1.6 17.5 1.6 13.1 4.3 10.4L12.8 1.9C14.4 0.3 16.9 0.3 18.5 1.9C20.1 3.5 20.1 6 18.5 7.6L9.6 16.5C8.8 17.3 7.5 17.3 6.7 16.5C5.9 15.7 5.9 14.4 6.7 13.6L14.5 5.8L15.9 7.2L8.1 15C7.7 15.4 7.7 16 8.1 16.4C8.5 16.8 9.1 16.8 9.5 16.4L18.4 7.5C19.6 6.3 19.6 4.4 18.4 3.2C17.2 2 15.3 2 14.1 3.2L5.6 11.7C3.5 13.8 3.5 17.2 5.6 19.3C7.7 21.4 11.1 21.4 13.2 19.3L21.7 10.8C23 9.5 23 7.4 21.7 6.1C20.4 4.8 18.3 4.8 17 6.1L8.5 14.6L7.1 13.2L15.6 4.7C17.5 2.8 20.6 2.8 22.5 4.7C24.4 6.6 24.4 9.7 22.5 11.6L14 20.1C10.5 23.6 4.7 23.6 1.2 20.1C-2.3 16.6 -2.3 10.8 1.2 7.3L9.7 -1.2C11.3 -2.8 13.5 -3.7 15.8 -3.7C18.1 -3.7 20.3 -2.8 21.9 -1.2" />
                  </svg>
                  Apple Pay
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.41 8H13v5.5h3.41c2.01 0 3.64-1.63 3.64-3.64S18.42 10 16.41 10zm-4.41-1h3.41c1.46 0 2.64 1.18 2.64 2.64 0 1.46-1.18 2.64-2.64 2.64H12V9zm-1 0H7.59c-2.01 0-3.64 1.63-3.64 3.64s1.63 3.64 3.64 3.64H11V9z"/>
                  </svg>
                  Google Pay
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="1" y="4" width="22" height="16" rx="2" />
                    <line x1="1" y1="10" x2="23" y2="10" />
                  </svg>
                  Kort
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link to={createPageUrl('Booking')}>
                  <Button size="lg" className="bg-[#4A90A4] hover:bg-[#3d7a8c] text-white rounded-full px-8 h-14 text-lg">
                    {t('getStarted')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to={createPageUrl('About')}>
                  <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-lg border-gray-300">
                    {t('learnMore')}
                  </Button>
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-8 mt-12 pt-8 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#4A90A4]" />
                  <span className="text-sm text-gray-600">{t('vettedDrivers')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-[#7FB069]" />
                  <span className="text-sm text-gray-600">{t('ecoConscious2')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-500" />
                  <span className="text-sm text-gray-600">{t('localPersonal')}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative hidden lg:block"
            >
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?w=800&q=80" 
                  alt="Gothenburg" 
                  className="rounded-3xl shadow-2xl"
                />
                
                {/* Floating cards */}
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -left-8 top-1/4 bg-white rounded-2xl shadow-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                      <Sun className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{t('summerCard')}</p>
                      <p className="text-sm text-gray-500">{t('archipelagoText')}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -right-8 bottom-1/4 bg-white rounded-2xl shadow-xl p-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Snowflake className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{t('winterCard')}</p>
                      <p className="text-sm text-gray-500">{t('cityDelivery')}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Seasonal Services */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('seasonalServices')}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('tailoredSeasons')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <Card className={`${service.bgColor} border-0 overflow-hidden group hover:shadow-xl transition-all duration-300`}>
                  <CardContent className="p-8">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                      <service.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{service.title}</h3>
                    <p className="text-gray-600 mb-6">{service.description}</p>
                    <Link to={createPageUrl('DeliveryErrands')}>
                      <Button variant="outline" className="rounded-full group-hover:bg-white">
                        {t('learnMore')} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Help at Home */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('helpAtHome')}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('nonMedicalAssistance')}
            </p>
          </motion.div>

          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {helpServices.map((service, index) => (
              <motion.div key={index} variants={fadeInUp}>
                <Card className="bg-white border-gray-100 hover:border-[#4A90A4]/30 hover:shadow-lg transition-all duration-300 h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-[#4A90A4]/10 flex items-center justify-center mb-4">
                      <service.icon className="h-6 w-6 text-[#4A90A4]" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-gray-600 text-sm">{service.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link to={createPageUrl('HelpAtHome')}>
              <Button size="lg" className="bg-[#4A90A4] hover:bg-[#3d7a8c] rounded-full px-8">
                {t('exploreAllServices')} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('ourValues')}</h2>
            <p className="text-xl text-gray-600">{t('whatMakesTaskCham')}</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="text-center"
              >
                <div className={`w-20 h-20 rounded-2xl ${value.color} bg-opacity-10 flex items-center justify-center mx-auto mb-6`}>
                  <value.icon className={`h-10 w-10 ${value.color}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-[#4A90A4] to-[#3d7a8c]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              {t('readyGetStarted')}
            </h2>
            <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              {t('bookFirstDelivery')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to={createPageUrl('Booking')}>
                <Button size="lg" className="bg-white text-[#4A90A4] hover:bg-gray-100 rounded-full px-8 h-14 text-lg">
                  {t('book')}
                </Button>
              </Link>
              <Link to={createPageUrl('DriverSignup')}>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 rounded-full px-8 h-14 text-lg">
                  {t('becomeDriver')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}