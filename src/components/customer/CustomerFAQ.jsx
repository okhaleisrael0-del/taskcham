import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, HelpCircle, Package, CreditCard, Clock, Shield, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CustomerFAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const faqCategories = [
    {
      icon: Package,
      title: 'Bokningar & Tjänster',
      items: [
        {
          q: 'Hur bokar jag ett uppdrag?',
          a: 'Klicka på "Boka" i menyn, välj tjänst (leverans, ärenden eller hjälp hemma), fyll i detaljer och betala. Du får bekräftelse direkt!'
        },
        {
          q: 'Kan jag boka för framtida datum?',
          a: 'Ja! När du bokar kan du välja önskat datum och tid. Du kan boka upp till 30 dagar i förväg.'
        },
        {
          q: 'Hur fungerar "Hjälp Hemma"-tjänsten?',
          a: 'Detta är en timbaserad tjänst där våra runners hjälper till med hushållsuppgifter, djurskötsel, inköp m.m. Du anger hur många timmar du behöver hjälp.'
        },
        {
          q: 'Vad händer om butiken inte har varan jag beställt?',
          a: 'Runnern kontaktar dig via appen och föreslår alternativ. Du godkänner eller avbryter köpet - helt din val!'
        }
      ]
    },
    {
      icon: CreditCard,
      title: 'Betalning & Priser',
      items: [
        {
          q: 'Hur beräknas priset?',
          a: 'Grundpris + avstånd + eventuella tillägg (expressfrakt, tunga varor etc). Du ser exakt pris innan du betalar.'
        },
        {
          q: 'När debiteras jag?',
          a: 'Betalning sker direkt när du bekräftar bokningen. För "Hjälp Hemma" kan admin justera priset innan betalning.'
        },
        {
          q: 'Har ni rabattkoder?',
          a: 'Ja! Nya kunder får ofta välkomsterbjudanden. Kolla din email och följ oss på sociala medier för kampanjer.'
        },
        {
          q: 'Vad är leveransskydd?',
          a: 'För 25 kr extra kan du försäkra värdefulla varor upp till 5,000 kr vid skada eller förlust under leveransen.'
        }
      ]
    },
    {
      icon: Clock,
      title: 'Avbokning & Ändringar',
      items: [
        {
          q: 'Kan jag avboka min bokning?',
          a: 'Ja, men det finns tidsregler: Mer än 24h före = full återbetalning. 4-24h = 50 kr till föraren. 2-4h = 100 kr till föraren. Mindre än 2h = ingen avbokning.'
        },
        {
          q: 'Hur avbokar jag?',
          a: 'Gå till "Aktiva Bokningar", välj uppdraget och klicka "Avboka". Följ instruktionerna.'
        },
        {
          q: 'Hur lång tid tar återbetalning?',
          a: 'Återbetalningar via Stripe tar 5-10 arbetsdagar beroende på din bank.'
        },
        {
          q: 'Kan jag ändra bokningsdetaljer efter bekräftelse?',
          a: 'Kontakta support direkt via chatten i appen så hjälper vi dig. Mindre ändringar är ofta möjliga före uppdraget påbörjas.'
        }
      ]
    },
    {
      icon: Shield,
      title: 'Säkerhet & Support',
      items: [
        {
          q: 'Är era runners verifierade?',
          a: 'Ja! Alla runners genomgår bakgrundskontroll och har godkända dokument (körkort, försäkring etc).'
        },
        {
          q: 'Vad händer om något går fel?',
          a: 'Du kan rapportera problem direkt i appen. Vi har också ett disputsystem för att lösa konflikter snabbt och rättvist.'
        },
        {
          q: 'Hur kontaktar jag min runner?',
          a: 'När uppdraget är tilldelat kan du chatta och ringa runnern direkt via appen.'
        },
        {
          q: 'Är mina personuppgifter säkra?',
          a: 'Absolut! Vi följer GDPR och använder kryptering för all känslig data. Läs vår integritetspolicy för mer info.'
        }
      ]
    },
    {
      icon: MapPin,
      title: 'Spårning & Leverans',
      items: [
        {
          q: 'Kan jag spåra min leverans i realtid?',
          a: 'Ja! När runnern är på väg kan du se deras position live på kartan i appen.'
        },
        {
          q: 'Får jag bevis på leverans?',
          a: 'Ja! Runnern tar foton vid upphämtning och leverans som bekräftelse. Du hittar dessa i din orderhistorik.'
        },
        {
          q: 'Vad händer om jag inte är hemma?',
          a: 'Meddela i "Anteckningar till förare" var paketet kan lämnas, eller boka en tid när du är hemma. Kontakta runnern via chatt om planer ändras.'
        },
        {
          q: 'Levererar ni till öar och glesbygd?',
          a: 'Ja! Vi har specialpriser för öar, fritidsområden och avlägsna platser. Priset justeras automatiskt vid bokning.'
        }
      ]
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-[#1E3A8A]/10 rounded-full mb-4">
          <HelpCircle className="h-8 w-8 text-[#1E3A8A]" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Vanliga Frågor</h2>
        <p className="text-gray-600">Hitta snabba svar på dina frågor nedan</p>
      </div>

      {faqCategories.map((category, catIndex) => (
        <Card key={catIndex}>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#1E3A8A]/10 rounded-lg flex items-center justify-center">
                <category.icon className="h-5 w-5 text-[#1E3A8A]" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
            </div>

            <div className="space-y-3">
              {category.items.map((item, itemIndex) => {
                const globalIndex = `${catIndex}-${itemIndex}`;
                const isOpen = openIndex === globalIndex;

                return (
                  <div key={itemIndex} className="border-b last:border-0 pb-3 last:pb-0">
                    <button
                      onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                      className="w-full flex items-start justify-between gap-3 text-left hover:text-[#1E3A8A] transition-colors"
                    >
                      <span className="font-medium text-gray-900">{item.q}</span>
                      <ChevronDown
                        className={`h-5 w-5 text-gray-400 flex-shrink-0 transition-transform ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <p className="text-gray-600 text-sm mt-3 leading-relaxed">
                            {item.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Contact Support */}
      <Card className="bg-gradient-to-r from-[#1E3A8A]/5 to-[#14B8A6]/5 border-2 border-[#1E3A8A]/20">
        <CardContent className="p-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">Hittade du inte svaret?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Kontakta vår support så hjälper vi dig direkt!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="mailto:support@taskcham.se" className="text-sm text-[#1E3A8A] font-medium hover:underline">
              📧 support@taskcham.se
            </a>
            <span className="hidden sm:inline text-gray-400">•</span>
            <a href="tel:+46123456789" className="text-sm text-[#1E3A8A] font-medium hover:underline">
              📞 +46 123 456 789
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}