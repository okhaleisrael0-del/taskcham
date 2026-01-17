import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from 'framer-motion';
import { 
  ShoppingBag, DollarSign, CreditCard, CheckCircle,
  Package, Home, Store, ArrowRight
} from 'lucide-react';

export default function HowItWorksPage() {
  const steps = [
    {
      icon: ShoppingBag,
      title: 'Välj vad du behöver hjälp med',
      description: 'Beskriva vad du behöver hämtat, levererat eller fixat',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: DollarSign,
      title: 'Se priset direkt',
      description: 'Transparent prissättning – du vet exakt vad det kostar',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: CreditCard,
      title: 'Betala säkert',
      description: 'Apple Pay, Google Pay eller kort – snabbt och tryggt',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: CheckCircle,
      title: 'En TaskCham-runner fixar det',
      description: 'Följ i realtid och få uppdateringar hela vägen',
      color: 'from-amber-500 to-orange-500'
    }
  ];

  const services = [
    { icon: Store, title: 'Mat & matbutiker', desc: 'ICA, Coop, Lidl, Hemköp' },
    { icon: Package, title: 'Paket & leveranser', desc: 'PostNord, DHL, Instabox' },
    { icon: Home, title: 'Apotek', desc: 'Medicin och hälsoprodukter' },
    { icon: Store, title: 'IKEA-beställningar', desc: 'Vi hämtar dina möbler' },
    { icon: Package, title: 'Facebook Marketplace', desc: 'Hämta eller leverera' },
    { icon: Home, title: 'Tunga saker', desc: 'Vi hjälper med lyft' },
    { icon: Home, title: 'Hemhjälp', desc: 'Disk, städning, djurvård' },
    { icon: Package, title: 'Snabba ärenden', desc: 'Vad du än behöver' }
  ];

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative py-24 bg-gradient-to-br from-slate-50 to-[#E8F4F8] overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-[#4A90A4]/10 to-[#7FB069]/10 rounded-full blur-3xl" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Hur fungerar det?
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Enkelt. Snabbt. Tryggt. TaskCham gör vardagen enklare för dig i Göteborg.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-lg h-full bg-gradient-to-br from-white to-gray-50">
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center mx-auto mb-6`}>
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-sm font-bold text-[#4A90A4] mb-2">STEG {index + 1}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                    <p className="text-gray-600 text-sm">{step.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Help With */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Vad kan vi hjälpa med?</h2>
            <p className="text-xl text-gray-600">Kan du beskriva det – kan vi fixa det.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 h-full">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-[#4A90A4]/10 flex items-center justify-center mb-4">
                      <service.icon className="h-6 w-6 text-[#4A90A4]" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{service.title}</h3>
                    <p className="text-sm text-gray-600">{service.desc}</p>
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
            <h2 className="text-4xl font-bold text-white mb-6">
              Redo att komma igång?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Börja använda TaskCham idag – Göteborg väntar.
            </p>
            <Link to={createPageUrl('Booking')}>
              <Button size="lg" className="bg-white text-[#4A90A4] hover:bg-gray-100 rounded-full px-8 h-14 text-lg">
                Boka Nu <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}