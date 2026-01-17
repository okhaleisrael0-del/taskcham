import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from './LanguageContext';
import { Heart, MapPin, Mail, Phone } from 'lucide-react';

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-[#4A90A4] to-[#7FB069] rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="text-xl font-semibold">TaskCham</span>
            </div>
            <p className="text-gray-400 text-sm mb-4">
              Göteborgs allt-i-ett-service. Vi hämtar, levererar och fixar saker åt dig – i alla väder.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="h-4 w-4" />
              <span>{t('gothenburgSweden')}</span>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-semibold mb-4">{t('services')}</h4>
            <ul className="space-y-2">
              <li>
                <Link to={createPageUrl('DeliveryErrands')} className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('deliveryErrands')}
                </Link>
              </li>
              <li>
                <Link to={createPageUrl('HelpAtHome')} className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('helpAtHome')}
                </Link>
              </li>
              <li>
                <Link to={createPageUrl('Pricing')} className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('pricing')}
                </Link>
              </li>
              <li>
                <Link to={createPageUrl('Booking')} className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('book')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">{t('company')}</h4>
            <ul className="space-y-2">
              <li>
                <Link to={createPageUrl('About')} className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('about')}
                </Link>
              </li>
              <li>
                <Link to={createPageUrl('Contact')} className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('contact')}
                </Link>
              </li>
              <li>
                <Link to={createPageUrl('DriverSignup')} className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('becomeDriver')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold mb-4">{t('legal')}</h4>
            <ul className="space-y-2">
              <li>
                <Link to={createPageUrl('Privacy')} className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link to={createPageUrl('Terms')} className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('termsConditions')}
                </Link>
              </li>
              <li>
                <Link to={createPageUrl('Cancellation')} className="text-gray-400 hover:text-white text-sm transition-colors">
                  {t('cancellationPolicy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} TaskCham. {t('allRightsReserved')}
          </p>
          <p className="text-gray-400 text-sm flex items-center gap-1">
            {t('madeWith')} <Heart className="h-4 w-4 text-red-500 fill-red-500" /> {t('inGothenburg')}
          </p>
        </div>
      </div>
    </footer>
  );
}