
import React, { useState, useEffect } from 'react';
import Home from './components/Home';
import Scheduling from './components/Scheduling';
import Services from './components/Services';
import Location from './components/Location';
import CutSuggestions from './components/CutSuggestions';
import Products from './components/Products'; // Imported
import Navigation from './components/Navigation';
import Admin from './components/Admin';
import FloatingSocialButtons from './components/FloatingSocialButtons';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import { dataProvider } from './dataProvider';
import { getSupabase, isSupabaseConfigured } from './services/supabaseClient';
import { DEFAULT_SETTINGS } from './constants';
import { BusinessSettings } from './types';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState('home');
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [headerLogoOk, setHeaderLogoOk] = useState(true);
  
  // Secret Admin Access State (Home Button)
  const [homeClickCount, setHomeClickCount] = useState(0);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const fetchedSettings = await dataProvider.getSettings();
        setSettings(fetchedSettings);
      } catch (e) { console.error(e); }
    };
    loadSettings();
  }, []);

  // If the logo URL changes (admin upload), allow it to render again.
  useEffect(() => {
    setHeaderLogoOk(true);
  }, [settings.logoUrl]);

  // Effect to update PWA/Browser Icon dynamically
  useEffect(() => {
    if (settings.appIconUrl) {
      let linkIcon = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!linkIcon) {
        linkIcon = document.createElement('link');
        linkIcon.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(linkIcon);
      }
      linkIcon.href = settings.appIconUrl;
      
      let linkApple = document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement;
      if (!linkApple) {
        linkApple = document.createElement('link');
        linkApple.rel = 'apple-touch-icon';
        document.getElementsByTagName('head')[0].appendChild(linkApple);
      }
      linkApple.href = settings.appIconUrl;
    }
  }, [settings.appIconUrl]);
  // Keep document title in sync with Admin settings.
  // IMPORTANT: We do NOT generate a dynamic manifest via Blob URL because Chrome may
  // consider it non-installable. The real manifest lives at /manifest.webmanifest.
  useEffect(() => {
    if (settings.name) document.title = settings.name;
  }, [settings.name]);
// Unified Navigation Handler (Desktop & Mobile)
  const handleTabChange = (tab: string) => {
    // Secret Access Logic: 5 consecutive clicks on 'home'
    if (tab === 'home') {
      const newCount = homeClickCount + 1;
      setHomeClickCount(newCount);
      
      if (newCount >= 5) {
        setCurrentTab('admin');
        setHomeClickCount(0);
        return; // Hijack navigation to go to Admin
      }
      
      // Reset counter if inactive for 2 seconds
      setTimeout(() => setHomeClickCount(0), 2000);
    } else {
      setHomeClickCount(0); // Reset if clicked another tab
    }
    
    // Safety check if user tries to navigate to products when disabled via URL or old state
    if (tab === 'products' && !settings.productsEnabled) {
      return;
    }

    setCurrentTab(tab);
  };

  const renderContent = () => {
    switch (currentTab) {
      case 'home': return <Home onNavigate={handleTabChange} settings={settings} />;
      case 'schedule': return <Scheduling settings={settings} />;
      case 'suggestions': return <CutSuggestions onNavigate={handleTabChange} />;
      case 'products': return settings.productsEnabled ? <Products /> : <Home onNavigate={handleTabChange} settings={settings} />;
      case 'services': return <Services />;
      case 'location': return <Location settings={settings} />;
      case 'admin': return <Admin />;
      default: return <Home onNavigate={handleTabChange} settings={settings} />;
    }
  };

  if (currentTab === 'admin') {
    return (
      <div className="min-h-screen relative">
         <Admin />
         <button 
           onClick={async () => {
             try {
               const email = (import.meta.env.VITE_ADMIN_EMAIL || '').trim();
               if (isSupabaseConfigured && email) {
                 await getSupabase().auth.signOut();
               }
             } catch {
               // ignore
             } finally {
               setCurrentTab('home');
             }
           }}
           className="fixed bottom-4 right-4 bg-[#2C1A1D] text-[#FDFBF7] p-3 rounded-full text-xs font-bold shadow-lg z-50"
         >
           Sair
         </button>
      </div>
    );
  }

  // Define desktop tabs with visibility check
  const desktopTabs = [
    { id: 'home', label: 'Início', visible: true },
    { id: 'schedule', label: 'Agendar', visible: true },
    { id: 'suggestions', label: 'Cortes', visible: true },
    { id: 'services', label: 'Preços', visible: true },
    { id: 'products', label: 'Produtos', visible: settings.productsEnabled },
    { id: 'location', label: 'Local', visible: true },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-texture">
      {/* Header - Responsive Layout */}
      <header className="h-16 lg:h-24 bg-[#FDFBF7] border-b border-[#E5E0D8] sticky top-0 z-40 shadow-sm flex items-center justify-between px-4 lg:px-12">
        <div className="flex items-center gap-3 lg:gap-4 select-none w-full lg:w-auto">
           {/* Logo - Only Render if URL exists */}
           {settings.logoUrl && headerLogoOk && (
             <img
               src={settings.logoUrl}
               alt="Logo"
               className="h-10 w-10 lg:h-16 lg:w-16 object-contain filter drop-shadow-sm"
               onError={() => setHeaderLogoOk(false)}
             />
           )}
           
           {/* Branding */}
           <div className="flex-1 lg:flex-none">
             <h1 className="font-serif text-lg lg:text-2xl font-bold text-[#2C1A1D] uppercase tracking-wider leading-tight">{settings.name}</h1>
             <p className="text-[9px] lg:text-[10px] text-[#B8860B] font-bold uppercase tracking-[0.2em] lg:tracking-[0.4em]">Barbearia Clássica</p>
           </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex gap-8">
           {desktopTabs.filter(t => t.visible).map(tab => (
             <button
               key={tab.id}
               onClick={() => handleTabChange(tab.id)}
               className={`text-xs font-bold uppercase tracking-[0.15em] hover:text-[#B8860B] transition-colors ${currentTab === tab.id ? 'text-[#B8860B]' : 'text-[#2C1A1D]'}`}
             >
               {tab.label}
             </button>
           ))}
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto animate-in">
        {renderContent()}
      </main>

      {/* Floating Social Buttons (Conditional: Home Only) */}
      <FloatingSocialButtons activeTab={currentTab} settings={settings} />

      {/* PWA Install (Mobile only; never shows on desktop) */}
      <PWAInstallPrompt settings={settings} />

      {/* Mobile Navigation Bar */}
      <div className="lg:hidden">
        <Navigation currentTab={currentTab} setTab={handleTabChange} productsEnabled={settings.productsEnabled} />
      </div>

      {/* Desktop Footer */}
      <footer className="hidden lg:block bg-[#2C1A1D] text-[#E5E0D8] py-12 mt-12 text-center">
         <div className="mb-4">
           <i className="fas fa-crown text-[#B8860B] text-2xl"></i>
         </div>
         <p className="font-serif text-xl mb-2">{settings.name}</p>
         <p className="text-sm font-sans opacity-60 mb-6">Tradição e excelência desde sempre.</p>
         
         {/* Desktop Social Media Links */}
         <div className="flex justify-center gap-4">
            {settings.whatsappLink && (
              <a href={settings.whatsappLink} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-[#B8860B] text-[#B8860B] flex items-center justify-center hover:bg-[#B8860B] hover:text-[#2C1A1D] transition-colors">
                <i className="fab fa-whatsapp text-lg"></i>
              </a>
            )}
            {settings.instagramLink && (
              <a href={settings.instagramLink} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-[#B8860B] text-[#B8860B] flex items-center justify-center hover:bg-[#B8860B] hover:text-[#2C1A1D] transition-colors">
                <i className="fab fa-instagram text-lg"></i>
              </a>
            )}
            {settings.facebookLink && (
              <a href={settings.facebookLink} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full border border-[#B8860B] text-[#B8860B] flex items-center justify-center hover:bg-[#B8860B] hover:text-[#2C1A1D] transition-colors">
                <i className="fab fa-facebook-f text-lg"></i>
              </a>
            )}
         </div>
      </footer>
    </div>
  );
};

export default App;
