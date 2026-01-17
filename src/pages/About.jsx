import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { 
  Heart, Shield, Leaf, MapPin, Users, Award,
  ArrowRight, Check
} from 'lucide-react';

export default function AboutPage() {
  const { t } = useLanguage();

  const values = [
    {
      icon: Shield,
      title: t('trust'),
      description: t('trustDesc'),
      color: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      icon: MapPin,
      title: t('local'),
      description: t('localDesc'),
      color: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      icon: Leaf,
      title: t('eco'),
      description: t('ecoDesc'),
      color: 'bg-emerald-50',
      iconColor: 'text-emerald-600'
    },
    {
      icon: Heart,
      title: t('personalService'),
      description: t('personalServiceDesc'),
      color: 'bg-rose-50',
      iconColor: 'text-rose-600'
    }
  ];

  const stats = [
    { value: 'Göteborg', label: t('basedOperating') },
    { value: '100%', label: t('vettedHelpers') },
    { value: 'Hybrid', label: t('ecoVehicles') },
    { value: t('sameDayService'), label: t('serviceAvailable') }
  ];

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative py-24 lg:py-32 bg-gradient-to-br from-slate-50 to-[#E8F4F8] overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#4A90A4]/10 to-[#7FB069]/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A90A4]/10 rounded-full text-[#4A90A4] text-sm font-medium mb-6">
                <Users className="h-4 w-4" />
                {t('about')}
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Vad är TaskCham?
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                TaskCham är en lokal tjänst i Göteborg som hjälper människor att få saker gjorda – utan stress.
              </p>
              <div className="space-y-6 text-gray-600">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Vi hämtar från:</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>ICA, Coop, Lidl</li>
                    <li>Apotek</li>
                    <li>IKEA, Elgiganten, Biltema</li>
                    <li>Paketombud (PostNord, DHL, Instabox)</li>
                    <li>Hem, kontor och butiker</li>
                  </ul>
                </div>
                <p className="font-medium">Och levererar direkt till din dörr.</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80" 
                alt="Gothenburg cityscape" 
                className="rounded-3xl shadow-xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-[#4A90A4] mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-8">{t('ourStory')}</h2>
            <div className="prose prose-lg mx-auto text-gray-600">
              <p>{t('storyPara1')}</p>
              <p>{t('storyPara2')}</p>
              <p>{t('storyPara3')}</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Values */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">{t('ourValues')}</h2>
            <p className="text-xl text-gray-600">{t('whatDrives')}</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`${value.color} border-0 h-full`}>
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto mb-6">
                      <value.icon className={`h-8 w-8 ${value.iconColor}`} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                    <p className="text-gray-600">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <img 
                src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80" 
                alt="Personal service" 
                className="rounded-3xl shadow-xl"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
                {t('localAlternative')}
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                {t('localAltDesc')}
              </p>
              <ul className="space-y-4">
                {[
                  t('vettedApproved'),
                  t('knowGothenburg'),
                  t('hybridVehicles'),
                  t('directCommunication'),
                  t('realPeople'),
                  t('fairPricing')
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-6 w-6 text-[#7FB069] flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Join Us */}
      <section className="py-24 bg-gradient-to-br from-[#4A90A4] to-[#3d7a8c]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              {t('joinTeam')}
            </h2>
            <p className="text-xl text-white/80 mb-8">
              {t('lookingForDrivers')}
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to={createPageUrl('DriverSignup')}>
                <Button size="lg" className="bg-white text-[#4A90A4] hover:bg-gray-100 rounded-full px-8 h-14 text-lg">
                  {t('becomeDriver')} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}