import React from 'react';
import { LanguageProvider, useLanguage } from './components/LanguageContext';
import { ElderlyModeProvider } from './components/accessibility/ElderlyModeToggle';
import Header from './components/Header';
import Footer from './components/Footer';

function LayoutContent({ children, currentPageName }) {
  const { isRTL } = useLanguage();
  
  const noLayoutPages = ['AdminDashboard', 'DriverDashboard', 'CustomerDashboard', 'Login'];
  const isNoLayout = noLayoutPages.includes(currentPageName);

  if (isNoLayout) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen">
        {children}
      </div>
    );
  }

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16 lg:pt-20">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default function Layout({ children, currentPageName }) {
  return (
    <LanguageProvider>
      <ElderlyModeProvider>
        <LayoutContent currentPageName={currentPageName}>
          {children}
        </LayoutContent>
      </ElderlyModeProvider>
    </LanguageProvider>
  );
}