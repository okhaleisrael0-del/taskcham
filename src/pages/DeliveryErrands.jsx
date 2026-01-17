import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { 
  Sun, Snowflake, MapPin, Truck, Package, 
  Clock, ArrowRight, Check, Waves, TreePine, Building2
} from 'lucide-react';

export default function DeliveryErrandsPage() {
  const { t } = useLanguage();

  const summerLocations = [
    'Marstrand', 'Vrångö', 'Styrsö', 'Donsö', 'Brännö',
    'Askim Beach (Askimbadet)', 'Delsjön', 'Billdal',
    'Hovås', 'Långedrag', 'Saltholmen', 'Southern Archipelago'
  ];

  const winterAreas = [
    'Gothenburg City Center', 'Hisingen', 'Majorna', 
    'Linnéstaden', 'Örgryte', 'Kungsladugård',
    'Johanneberg', 'Vasastan', 'Gamlestaden'
  ];

  const features = [
    { icon: Truck, title: t('ecoConsciousVehicles'), desc: t('hybridFuel') },
    { icon: Clock, title: t('flexibleScheduling'), desc: t('bookSameDay') },
    { icon: Package, title: t('allItemSizes'), desc: t('smallToMedium') },
    { icon: Check, title: t('realTimeUpdates'), desc: t('trackDelivery') }
  ];

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative py-24 lg:py-32 bg-gradient-to-br from-slate-50 to-[#E8F4F8] overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#4A90A4]/10 to-[#7FB069]/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A90A4]/10 rounded-full text-[#4A90A4] text-sm font-medium mb-6">
              <Truck className="h-4 w-4" />
              {t('deliveryErrands')}
            </div>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6">
              {t('deliveryErrandsTitle')}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {t('personalReliable')}
            </p>
            <Link to={createPageUrl('Booking')}>
              <Button size="lg" className="bg-[#4A90A4] hover:bg-[#3d7a8c] rounded-full px-8 h-14 text-lg">
                {t('book')} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-14 h-14 rounded-xl bg-[#4A90A4]/10 flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-7 w-7 text-[#4A90A4]" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Summer Services */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-100 rounded-full text-amber-700 text-sm font-medium mb-6">
                <Sun className="h-4 w-4" />
                {t('summerServices')}
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                {t('deliveryToLeisure')}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                {t('summerInGothenburg')}
              </p>

              <div className="mb-8">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Waves className="h-5 w-5 text-[#4A90A4]" />
                  {t('popularSummer')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {summerLocations.map((location, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm"
                    >
                      {location}
                    </span>
                  ))}
                </div>
              </div>

              <Link to={createPageUrl('Booking')}>
                <Button className="bg-amber-500 hover:bg-amber-600 rounded-full px-6">
                  {t('bookSummerDelivery')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img 
                src="https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=800&q=80" 
                alt="Swedish Archipelago" 
                className="rounded-3xl shadow-xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Winter Services */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-2 lg:order-1"
            >
              <img 
                src="https://images.unsplash.com/photo-1548777123-e216912df7d8?w=800&q=80" 
                alt="Winter Gothenburg" 
                className="rounded-3xl shadow-xl"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="order-1 lg:order-2"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-6">
                <Snowflake className="h-4 w-4" />
                {t('winterServices')}
              </div>
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                {t('cozyCityDeliveries')}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                {t('coldOutside')}
              </p>

              <div className="mb-8">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#4A90A4]" />
                  {t('cityCoverage')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {winterAreas.map((area, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </div>

              <Link to={createPageUrl('Booking')}>
                <Button className="bg-blue-500 hover:bg-blue-600 rounded-full px-6">
                  {t('bookCityDelivery')} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What We Deliver */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{t('whatWeDeliver')}</h2>
            <p className="text-xl text-gray-600">{t('smallToMediumItems')}</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: t('groceries'), desc: t('fromFavorite') },
              { title: t('pharmacyItems'), desc: t('medicineHealth') },
              { title: t('packages'), desc: t('parcelsShipments') },
              { title: t('documents2'), desc: t('importantPapers') },
              { title: t('foodDelivery'), desc: t('restaurantOrders') },
              { title: t('gifts'), desc: t('flowersPresents') },
              { title: t('householdItems'), desc: t('essentialSupplies') },
              { title: t('andMore'), desc: t('justAsk') }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-gray-100 hover:border-[#4A90A4]/30 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-[#4A90A4] to-[#3d7a8c]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              {t('needDeliveryErrand')}
            </h2>
            <p className="text-xl text-white/80 mb-8">
              {t('bookGetSameDay')}
            </p>
            <Link to={createPageUrl('Booking')}>
              <Button size="lg" className="bg-white text-[#4A90A4] hover:bg-gray-100 rounded-full px-8 h-14 text-lg">
                {t('book')}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}