import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useLanguage } from '@/components/LanguageContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { motion } from 'framer-motion';
import { 
  User, Mail, Phone, Car, MapPin, Check, Shield, Clock, 
  DollarSign, Users, Leaf
} from 'lucide-react';

export default function DriverSignupPage() {
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    vehicle_type: '',
    role: 'both',
    service_areas: [],
    agreement_accepted: false
  });

  const serviceAreas = [
    'Gothenburg City Center', 'Hisingen', 'Majorna', 'Linnéstaden',
    'Örgryte', 'Askim', 'Hovås', 'Marstrand', 'Southern Archipelago'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.agreement_accepted) return;
    
    setIsSubmitting(true);
    
    await base44.entities.Driver.create({
      ...formData,
      status: 'pending',
      dashboard_access: 'active',
      availability: 'offline',
      agreement_accepted_date: new Date().toISOString(),
      total_earnings: 0,
      completed_tasks: 0
    });
    
    setIsComplete(true);
    setIsSubmitting(false);
  };

  const benefits = [
    { icon: Clock, title: t('flexibleHoursWork'), desc: t('workWhenSuits') },
    { icon: DollarSign, title: t('fairPay'), desc: t('competitiveRates') },
    { icon: Users, title: t('joinCommunity'), desc: t('bePartLocal') },
    { icon: Leaf, title: t('ecoFriendly'), desc: t('makePositiveImpact') }
  ];

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-[#E8F4F8] py-24 flex items-center">
        <div className="max-w-md mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-0 shadow-xl">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('applicationSubmitted')}</h2>
                <p className="text-gray-600 mb-6">{t('pendingApproval')}</p>
                <p className="text-sm text-gray-500">
                  {t('reviewWithin')}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

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
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A90A4]/10 rounded-full text-[#4A90A4] text-sm font-medium mb-6">
                <Car className="h-4 w-4" />
                {t('becomeDriver')}
              </div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                {t('driverSignup')}
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                {t('joinTeamTrusted')}
              </p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#4A90A4]/10 flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="h-5 w-5 text-[#4A90A4]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{benefit.title}</p>
                      <p className="text-sm text-gray-500">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="border-0 shadow-xl">
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <Label htmlFor="name" className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-500" />
                        {t('fullName')}
                      </Label>
                      <Input
                        id="name"
                        placeholder={t('yourFullName2')}
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="h-12"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="flex items-center gap-2 mb-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        {t('email')}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="h-12"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="flex items-center gap-2 mb-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        {t('phoneNumber')}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+46 XXX XXX XXX"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="h-12"
                        required
                      />
                    </div>

                    <div>
                      <Label className="flex items-center gap-2 mb-3">
                        <Car className="h-4 w-4 text-gray-500" />
                        {t('vehicleType')}
                      </Label>
                      <RadioGroup 
                        value={formData.vehicle_type} 
                        onValueChange={(value) => setFormData({...formData, vehicle_type: value})}
                        className="space-y-2"
                      >
                        {[
                          { value: 'hybrid', label: t('hybridCar') },
                          { value: 'normal_car', label: t('normalCar') },
                          { value: 'none', label: t('noVehicle') }
                        ].map((option) => (
                          <Label
                            key={option.value}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer ${
                              formData.vehicle_type === option.value
                                ? 'border-[#4A90A4] bg-[#4A90A4]/5'
                                : 'border-gray-200'
                            }`}
                          >
                            <RadioGroupItem value={option.value} />
                            <span>{option.label}</span>
                          </Label>
                        ))}
                      </RadioGroup>
                    </div>

                    <div>
                      <Label className="flex items-center gap-2 mb-3">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        {t('serviceAreas')}
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {serviceAreas.map((area) => (
                          <Label
                            key={area}
                            className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer text-sm ${
                              formData.service_areas.includes(area)
                                ? 'border-[#4A90A4] bg-[#4A90A4]/5'
                                : 'border-gray-200'
                            }`}
                          >
                            <Checkbox
                              checked={formData.service_areas.includes(area)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFormData({...formData, service_areas: [...formData.service_areas, area]});
                                } else {
                                  setFormData({...formData, service_areas: formData.service_areas.filter(a => a !== area)});
                                }
                              }}
                            />
                            <span>{area}</span>
                          </Label>
                        ))}
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-xl p-5 border border-blue-200">
                      <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2 text-lg">
                        <Shield className="h-5 w-5" />
                        Välkommen till TaskCham!
                      </h4>
                      <p className="text-sm text-blue-800 mb-4">
                        Du hjälper kunder med leveranser, ärenden och vardagshjälp.
                      </p>

                      <div className="space-y-3 mb-4">
                        <div>
                          <p className="font-semibold text-blue-900 mb-2">Du ska:</p>
                          <ul className="space-y-1 text-sm text-blue-800">
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span>Vara artig och professionell</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span>Följa trafikregler</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span>Använda butikens bokningsnummer vid upphämtning</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                              <span>Respektera kundens hem och integritet</span>
                            </li>
                          </ul>
                        </div>

                        <div>
                          <p className="font-semibold text-blue-900 mb-2">Du får inte:</p>
                          <ul className="space-y-1 text-sm text-blue-800">
                            <li className="flex items-start gap-2">
                              <span className="text-red-600 font-bold flex-shrink-0">✖</span>
                              <span>Ge medicinsk hjälp</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-600 font-bold flex-shrink-0">✖</span>
                              <span>Utföra tungt arbete</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="text-red-600 font-bold flex-shrink-0">✖</span>
                              <span>Ta emot kontanter utan tillstånd</span>
                            </li>
                          </ul>
                        </div>
                      </div>

                      <Label className="flex items-start gap-3 cursor-pointer p-3 bg-white rounded-lg border-2 border-blue-300">
                        <Checkbox
                          checked={formData.agreement_accepted}
                          onCheckedChange={(checked) => setFormData({...formData, agreement_accepted: checked})}
                          className="mt-0.5"
                        />
                        <span className="text-sm font-medium text-blue-900">
                          ☑ Jag godkänner TaskChams regler
                        </span>
                      </Label>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-[#4A90A4] hover:bg-[#3d7a8c] rounded-full h-12"
                      disabled={!formData.agreement_accepted || isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          {t('processing2')}
                        </span>
                      ) : (
                        t('submitApplication')
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}