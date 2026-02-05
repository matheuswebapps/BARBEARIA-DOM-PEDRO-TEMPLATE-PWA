
import React from 'react';

interface NavigationProps {
  currentTab: string;
  setTab: (tab: string) => void;
  productsEnabled: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ currentTab, setTab, productsEnabled }) => {
  // Order: Home, Schedule, Cuts, Services, Products (if on), Location
  const tabs = [
    { id: 'home', icon: 'fa-home', label: 'Início', mobileLabel: 'Início' },
    { id: 'schedule', icon: 'fa-calendar-check', label: 'Agendar', mobileLabel: 'Agendar' },
    { id: 'suggestions', icon: 'fa-cut', label: 'Cortes', mobileLabel: 'Cortes' },
    { id: 'services', icon: 'fa-list-ul', label: 'Serviços', mobileLabel: 'Preços' },
    { id: 'products', icon: 'fa-pump-soap', label: 'Produtos', mobileLabel: 'Loja', visible: productsEnabled },
    { id: 'location', icon: 'fa-map-marker-alt', label: 'Local', mobileLabel: 'Local' },
  ];

  const visibleTabs = tabs.filter(tab => tab.visible !== false);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#2C1A1D] border-t border-[#B8860B] pb-safe-area-inset-bottom z-50 shadow-[0_-5px_20px_rgba(0,0,0,0.3)] lg:hidden">
      <div className={`grid ${visibleTabs.length > 5 ? 'grid-cols-6' : 'grid-cols-5'} h-16 w-full`}>
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 ${
              currentTab === tab.id ? 'text-[#B8860B] bg-white/5' : 'text-[#E5E0D8]'
            }`}
          >
            <i className={`fas ${tab.icon} ${visibleTabs.length > 5 ? 'text-base' : 'text-lg'} mb-1 ${currentTab === tab.id ? 'scale-110' : 'opacity-70'}`}></i>
            <span className={`${visibleTabs.length > 5 ? 'text-[8px]' : 'text-[9px]'} uppercase font-bold tracking-widest font-serif truncate w-full text-center px-1`}>
              {tab.mobileLabel}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;
