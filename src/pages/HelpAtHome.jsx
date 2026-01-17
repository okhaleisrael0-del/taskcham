import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { 
  Home, Dog, Sparkles, ShoppingBag, Package, Users,
  ArrowRight, Check, Heart, Shield, Clock, AlertTriangle
} from 'lucide-react';

export default function HelpAtHomePage() {
  const { t } = useLanguage();

  const services = [
    {
      icon: Dog,
      title: t('petCare'),
      description: t('petCareDesc'),
      details: [t('shortVisits'), t('feedingWater'), t('dogWalking'), t('medicationReminder')],
      color: 'bg-amber-50',
      iconColor: 'text-amber-600'
    },
    {
      icon: Sparkles,
      title: t('dishesCleanup'),
      description: t('dishesCleanupDesc'),
      details: [t('washingDrying'), t('kitchenCounter'), t('loadingDishwasher'), t('lightKitchen')],
      color: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      icon: Home,
      title: t('householdHelp'),
      description: t('householdHelpDesc'),
      details: [t('wateringPlants'), t('takingTrash'), t('lightTidying'), t('mailCollection')],
      color: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      icon: ShoppingBag,
      title: t('storePickup'),
      description: t('storePickupDesc'),
      details: [t('groceryShopping'), t('pharmacyPickup'), t('localStoreErrands'), t('dryCleaningPickup')],
      color: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      icon: Package,
      title: t('parcelReturns'),
      description: t('parcelReturnsDesc'),
      details: [t('packageReturns'), t('postOfficeErrands'), t('servicePointPickups'), t('shippingParcels')],
      color: 'bg-rose-50',
      iconColor: 'text-rose-600'
    },
    {
      icon: Users,
      title: t('elderlySupport'),
      description: t('elderlySupportDesc'),
      details: [t('companionshipVisits'), t('helpWithErrands'), t('lightHouseholdAssist'), t('technologyHelp')],
      color: 'bg-teal-50',
      iconColor: 'text-teal-600'
    }
  ];

  const whyChoose = [
    { icon: Shield, title: t('vettedHelpersTitle'), desc: t('allHelpersScreened') },
    { icon: Heart, title: t('caringService'), desc: t('personalAttention') },
    { icon: Clock, title: t('flexibleHours'), desc: t('bookWhenSuits') }
  ];

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative py-24 lg:py-32 bg-gradient-to-br from-slate-50 to-[#E8F4F8] overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#7FB069]/10 to-[#4A90A4]/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#7FB069]/10 rounded-full text-[#7FB069] text-sm font-medium mb-6">
              <Home className="h-4 w-4" />
              {t('helpAtHome')}
            </div>
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6">
              {t('helpAtHomeTitle')}
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              {t('nonMedicalEveryday')}
            </p>
            <Link to={createPageUrl('Booking')}>
              <Button size="lg" className="bg-[#7FB069] hover:bg-[#6a9658] rounded-full px-8 h-14 text-lg">
                {t('book')} <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Important Notice */}
      <section className="py-8 bg-amber-50 border-y border-amber-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 text-amber-800">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">
              <strong>{t('importantNotice')}</strong> {t('nonMedicalNotice')}
            </p>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{t('ourServices')}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('chooseRange')}
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${service.color} border-0 h-full hover:shadow-xl transition-all duration-300`}>
                  <CardContent className="p-8">
                    <div className={`w-14 h-14 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-6`}>
                      <service.icon className={`h-7 w-7 ${service.iconColor}`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{service.title}</h3>
                    <p className="text-gray-600 mb-6">{service.description}</p>
                    <ul className="space-y-2">
                      {service.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="h-4 w-4 text-[#7FB069] mt-0.5 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                {t('whyChooseTaskCham')}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                {t('invitingSomeone')}
              </p>

              <div className="space-y-6">
                {whyChoose.map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#7FB069]/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-6 w-6 text-[#7FB069]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-gray-600">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img 
                src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80" 
                alt="Home help" 
                className="rounded-3xl shadow-xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Who We Help */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{t('whoWeHelp')}</h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: t('busyProfessionals'), desc: t('noTimeErrands') },
              { title: t('elderlyIndividuals'), desc: t('extraHelpDaily') },
              { title: t('newParents'), desc: t('focusOnBaby') },
              { title: t('anyoneNeedsHelp'), desc: t('recoveringTraveling') }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="text-center h-full border-gray-100 hover:border-[#7FB069]/30 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-[#7FB069] to-[#6a9658]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              {t('needHelpAtHome')}
            </h2>
            <p className="text-xl text-white/80 mb-8">
              {t('bookTrustedHelper')}
            </p>
            <Link to={createPageUrl('Booking')}>
              <Button size="lg" className="bg-white text-[#7FB069] hover:bg-gray-100 rounded-full px-8 h-14 text-lg">
                {t('book')}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}