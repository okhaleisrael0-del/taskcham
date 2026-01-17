import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { 
  Building2, TreePine, Waves, Clock, MapPin, Package, 
  AlertTriangle, ArrowRight, Check, Info
} from 'lucide-react';

export default function PricingPage() {
  const { t } = useLanguage();

  const mainPricing = [
    {
      icon: Building2,
      title: t('cityService'),
      subtitle: t('withinCity'),
      price: 99,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      features: [t('upTo5km'), t('sameDayDelivery'), t('realTimeTracking')]
    },
    {
      icon: TreePine,
      title: t('leisureAreas'),
      subtitle: t('coastalLake'),
      price: 129,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      features: [t('beaches'), t('extendedZone'), t('ecoTransport')],
      popular: true
    },
    {
      icon: Waves,
      title: t('islands'),
      subtitle: t('archipelago'),
      price: '149-199',
      color: 'from-purple-500 to-indigo-500',
      bgColor: 'bg-purple-50',
      features: [t('marstrand'), t('ferryCoord'), t('islandPricing')]
    }
  ];

  const addOns = [
    { name: t('waitingTime'), price: 50, unit: t('per15min'), icon: Clock },
    { name: t('multipleStops'), price: 30, unit: t('perStop'), icon: MapPin },
    { name: t('fragileItems'), price: 25, unit: t('perOrder'), icon: Package },
    { name: t('peakTime'), price: '20%', unit: t('surcharge'), icon: AlertTriangle }
  ];

  const helpAtHomePricing = [
    { service: t('petCareShort'), price: 149 },
    { service: t('dishesKitchen'), price: 149 },
    { service: t('lightHousehold'), price: 149 },
    { service: t('storePickupErr'), price: '99+' },
    { service: t('parcelRet'), price: 99 },
    { service: t('elderlyHour'), price: 199 }
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
              {t('pricingTitle')}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('pricingSubtitle')}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Pricing Cards */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {mainPricing.map((tier, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-[#4A90A4] to-[#7FB069] text-white text-sm font-medium rounded-full">
                    {t('mostPopular')}
                  </div>
                )}
                <Card className={`${tier.bgColor} border-0 h-full ${tier.popular ? 'ring-2 ring-[#4A90A4]' : ''}`}>
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${tier.color} flex items-center justify-center mx-auto mb-4`}>
                      <tier.icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl">{tier.title}</CardTitle>
                    <p className="text-sm text-gray-600">{tier.subtitle}</p>
                  </CardHeader>
                  <CardContent className="text-center">
                    <div className="mb-6">
                      <span className="text-sm text-gray-500">{t('startingFrom')}</span>
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold text-gray-900">{tier.price}</span>
                        <span className="text-gray-600">{t('sek')}</span>
                      </div>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-center justify-center gap-2 text-sm text-gray-700">
                          <Check className="h-4 w-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Link to={createPageUrl('Booking')}>
                      <Button className={`w-full rounded-full ${tier.popular ? 'bg-[#4A90A4] hover:bg-[#3d7a8c]' : 'bg-gray-900 hover:bg-gray-800'}`}>
                        {t('book')}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Distance Pricing */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A90A4]/10 rounded-full text-[#4A90A4] text-sm font-medium mb-4">
              <MapPin className="h-4 w-4" />
              {t('distancePricing')}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('additionalDistance')}</h2>
            <p className="text-gray-600 mb-6">{t('first5km')}</p>
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="text-4xl font-bold text-gray-900 mb-2">+10 {t('sek')}</div>
              <div className="text-gray-600">{t('perKm')}</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Add-ons */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('optionalAddons')}</h2>
            <p className="text-gray-600">{t('additionalServices')}</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {addOns.map((addon, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="text-center border-gray-100 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                      <addon.icon className="h-6 w-6 text-gray-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{addon.name}</h3>
                    <div className="text-2xl font-bold text-[#4A90A4]">
                      {typeof addon.price === 'number' ? `+${addon.price}` : addon.price}
                      {typeof addon.price === 'number' && <span className="text-sm font-normal text-gray-500"> {t('sek')}</span>}
                    </div>
                    <p className="text-sm text-gray-500">{addon.unit}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Help at Home Pricing */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('helpAtHomePricing')}</h2>
            <p className="text-gray-600">{t('nonMedical')}</p>
          </motion.div>

          <Card className="border-0 shadow-xl">
            <CardContent className="p-0">
              {helpAtHomePricing.map((item, index) => (
                <div 
                  key={index}
                  className={`flex items-center justify-between p-6 ${index !== helpAtHomePricing.length - 1 ? 'border-b border-gray-100' : ''}`}
                >
                  <span className="text-gray-900 font-medium">{item.service}</span>
                  <span className="text-lg font-bold text-[#7FB069]">
                    {t('startingFrom')} {item.price} {t('sek')}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Info Note */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-50 rounded-2xl p-6 flex items-start gap-4">
            <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">{t('howPricingWorks')}</h4>
              <p className="text-gray-600 text-sm">
                {t('priceExplanation')}
              </p>
            </div>
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
              {t('readyToBook')}
            </h2>
            <p className="text-xl text-white/80 mb-8">
              {t('instantQuote')}
            </p>
            <Link to={createPageUrl('Booking')}>
              <Button size="lg" className="bg-white text-[#4A90A4] hover:bg-gray-100 rounded-full px-8 h-14 text-lg">
                {t('book')} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}