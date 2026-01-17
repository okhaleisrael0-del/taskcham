import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useLanguage } from './LanguageContext';
import LanguageSelector from './LanguageSelector';
import RunnerDashboardButton from './RunnerDashboardButton';
import NotificationBell from '@/components/notifications/NotificationBell';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, X, Truck, Home, DollarSign, Info, Phone, User, LogIn } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Header() {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { label: t('home'), href: 'Home', icon: Home },
    { label: 'Mina Bokningar', href: 'CustomerDashboard', icon: User },
    { label: t('availableJobs'), href: 'Listings', icon: Truck },
    { label: t('deliveryErrands'), href: 'DeliveryErrands', icon: Truck },
    { label: t('helpAtHome'), href: 'HelpAtHome', icon: Home },
    { label: '🛒 Köp & Leverera', href: 'BuyDeliver', icon: Truck },
    { label: t('pricing'), href: 'Pricing', icon: DollarSign },
    { label: t('about'), href: 'About', icon: Info },
    { label: 'Hur fungerar det?', href: 'HowItWorks', icon: Info },
    { label: t('contact'), href: 'Contact', icon: Phone },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#4A90A4] to-[#7FB069] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">T</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">TaskCham</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                to={createPageUrl(item.href)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <NotificationBell />
            
            <div className="hidden sm:block">
              <RunnerDashboardButton />
            </div>

            <Link to={createPageUrl('Booking')} className="hidden sm:block">
              <Button className="bg-[#4A90A4] hover:bg-[#3d7a8c] text-white rounded-full px-6">
                {t('book')}
              </Button>
            </Link>

            <Link to={createPageUrl('CustomerDashboard')} className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-gray-600">
                <User className="h-4 w-4 mr-2" />
                Mina Bokningar
              </Button>
            </Link>

            <Link to={createPageUrl('DriverDashboard')} className="hidden sm:block">
              <Button variant="ghost" size="sm" className="text-gray-600">
                <LogIn className="h-4 w-4 mr-2" />
                {t('login')}
              </Button>
            </Link>

            {/* Mobile menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  <div className="p-6 border-b">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#4A90A4] to-[#7FB069] rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">T</span>
                      </div>
                      <span className="text-xl font-semibold">TaskCham</span>
                    </div>
                  </div>
                  
                  <nav className="flex-1 p-4">
                    {navItems.map((item) => (
                      <Link
                        key={item.href}
                        to={createPageUrl(item.href)}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
                      >
                        <item.icon className="h-5 w-5 text-gray-400" />
                        {item.label}
                      </Link>
                    ))}
                  </nav>

                  <div className="p-4 border-t space-y-3">
                    <div onClick={() => setIsOpen(false)}>
                      <RunnerDashboardButton />
                    </div>
                    <Link to={createPageUrl('Booking')} onClick={() => setIsOpen(false)}>
                      <Button className="w-full bg-[#4A90A4] hover:bg-[#3d7a8c] rounded-full">
                        {t('book')}
                      </Button>
                    </Link>
                    <Link to={createPageUrl('CustomerDashboard')} onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full rounded-full">
                        <User className="h-4 w-4 mr-2" />
                        Mina Bokningar
                      </Button>
                    </Link>
                    <Link to={createPageUrl('DriverDashboard')} onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full rounded-full">
                        <LogIn className="h-4 w-4 mr-2" />
                        {t('login')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}