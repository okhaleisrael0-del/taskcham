import React from 'react';
import { useLanguage } from '@/components/LanguageContext';
import { motion } from 'framer-motion';
import { FileText, CheckCircle } from 'lucide-react';

export default function TermsPage() {
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
              <FileText className="h-4 w-4" />
              Legal
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              TaskCham Användarvillkor
            </h1>
            <p className="text-gray-500">Senast uppdaterad: Januari 2025</p>
          </motion.div>
        </div>
      </section>

      {/* Content */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Quick Summary */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg mb-12">
            <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              TaskCham Terms – Kort Version
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>• TaskCham agerar som förmedlare mellan kunder och runners</li>
              <li>• Priser beräknas baserat på avstånd, tid eller uppdragstyp</li>
              <li>• Betalningar måste slutföras innan en runner startar uppdraget</li>
              <li>• TaskCham ansvarar inte för butikers lagerstatus eller tredjepartsförseningar</li>
              <li>• Kunder måste tillhandahålla korrekta adresser och ordernummer</li>
              <li>• Avbokningar efter att runner tilldelats kan medföra avgift</li>
              <li>• Foton och videor används endast för att uppskatta jobbet</li>
              <li>• Återbetalningar hanteras från fall till fall</li>
            </ul>
          </div>

          <div className="prose prose-lg max-w-none">
            <h2>1. Om TaskCham</h2>
            <p>
              TaskCham är en lokal tjänst i Göteborg som hjälper människor att få saker gjorda – utan stress. 
              Vi förmedlar uppdrag mellan kunder och lokala runners (förare/hjälpare).
            </p>
            <p>
              <strong>Viktigt:</strong> TaskCham agerar som förmedlare. Vi ansvarar inte för butikers lagerstatus, 
              tredjepartsförseningar eller felaktig information från externa parter.
            </p>

            <h2>2. Våra Tjänster</h2>
            <p>Vi erbjuder:</p>
            <ul>
              <li>Leveranser och upphämtningar från ICA, Coop, Lidl, apotek, IKEA, m.fl.</li>
              <li>Paketärenden (PostNord, DHL, Instabox)</li>
              <li>Hemhjälp som disk, städning, djurvård (icke-medicinsk)</li>
              <li>Tunga lyft och möbelmontering</li>
              <li>Facebook Marketplace hämtning/leverans</li>
            </ul>

            <h2>3. Prissättning och Betalning</h2>
            <p>
              Priser beräknas baserat på avstånd, tid eller uppdragstyp. 
              Du ser alltid det totala priset innan du bekräftar din bokning.
            </p>
            <p>
              <strong>Betalningar måste slutföras innan en runner tilldelas uppdraget.</strong> Vi accepterar Apple Pay, Google Pay och kort.
            </p>
            <p>
              Återbetalningar hanteras från fall till fall beroende på omständigheterna. Kontakta oss via WhatsApp eller Facebook för support.
            </p>

            <h2>4. Kundens Ansvar</h2>
            <p>Som kund måste du:</p>
            <ul>
              <li><strong>Tillhandahålla korrekta adresser och ordernummer</strong></li>
              <li>Vara tillgänglig för kommunikation under uppdraget</li>
              <li>Behandla runners med respekt</li>
              <li>Inte begära olagliga eller farliga tjänster</li>
            </ul>
            <p>
              Om information är felaktig kan uppdraget försenas eller misslyckas, och kunden ansvarar för eventuella extra kostnader.
            </p>

            <h2>5. Media och Foton</h2>
            <p>
              Foton och videor som laddas upp vid bokning används endast för att uppskatta uppdraget och förbättra servicen. 
              Vi delar inte dina bilder med tredje part.
            </p>

            <h2>6. Avbokningar</h2>
            <p>
              Avbokningar kan göras innan en runner har tilldelats uppdraget utan kostnad.
            </p>
            <p>
              <strong>Efter tilldelning kan avgifter tillkomma</strong> beroende på hur långt arbetet har påbörjats. 
              Om en runner redan är på väg eller har påbörjat uppdraget kan du inte avboka utan kostnad.
            </p>

            <h2>7. Ansvar och Begränsningar</h2>
            <p>
              TaskCham ansvarar inte för:
            </p>
            <ul>
              <li>Förseningar orsakade av väder, trafik eller tredje part</li>
              <li>Butikers lagerstatus eller tillgänglighet</li>
              <li>Felaktigt levererad information från kund</li>
              <li>Skador på varor som redan var skadade vid upphämtning</li>
            </ul>
            <p>
              Vi gör vårt bästa för att leverera inom den angivna tiden men kan inte garantera exakta tider.
            </p>

            <h2>8. Runners (Förare/Hjälpare)</h2>
            <p>
              Alla runners är noggrant granskade och godkända av TaskCham innan de får acceptera uppdrag. 
              De är oberoende uppdragstagare som följer våra kvalitets- och säkerhetsstandarder.
            </p>

            <h2>9. Support</h2>
            <p>
              Behöver du hjälp? Kontakta oss via WhatsApp eller Facebook så hjälper en riktig person i Göteborg dig.
            </p>

            <h2>10. Lagstiftning</h2>
            <p>
              Dessa villkor regleras av svensk lag. Eventuella tvister avgörs i svensk domstol.
            </p>

            <h2>11. Ändringar av Villkor</h2>
            <p>
              Vi kan uppdatera dessa villkor från tid till annan. Fortsatt användning av våra tjänster efter ändringar innebär att du accepterar de nya villkoren.
            </p>

            <h2>12. Kontakt</h2>
            <p>
              För frågor om dessa villkor, kontakta oss:<br />
              E-post: hello@taskcham.se<br />
              Plats: Göteborg, Sverige
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}