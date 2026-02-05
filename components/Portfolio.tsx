
import React, { useState, useEffect } from 'react';
import { dataProvider } from '../dataProvider';
import { PortfolioItem, BusinessSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { LOGO_FALLBACK } from '../constants';

interface PortfolioProps {
  onNavigate?: (tabId: string) => void;
}

const Portfolio: React.FC<PortfolioProps> = ({ onNavigate }) => {
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [fetchedItems, fetchedSettings] = await Promise.all([
        dataProvider.getPortfolio(),
        dataProvider.getSettings()
      ]);
      setItems(fetchedItems.filter(i => i.active));
      setSettings(fetchedSettings);
    };
    fetchData();
  }, []);

  const handleStyleSelect = (id: string) => {
    setSelectedStyleId(id);
  };

  const handleBooking = () => {
    if (selectedStyleId) {
      localStorage.setItem('fio_selected_style', selectedStyleId);
    }
    if (onNavigate) {
      onNavigate('schedule');
    }
  };

  return (
    <div className="p-6 pb-24 min-h-screen lg:max-w-screen-xl lg:mx-auto">
      <div className="mb-14 flex flex-col items-center text-center">
        {settings.logoUrl && (
          <img 
            src={settings.logoUrl} 
            alt="Logo" 
            className="w-16 h-16 object-contain mb-6 drop-shadow-xl" 
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <h2 className="text-4xl lg:text-5xl font-montserrat font-bold uppercase text-white mb-4">Galeria de Estilos</h2>
        <div className="h-1 w-24 bg-red-600 rounded-full mb-6"></div>
        <p className="text-slate-400 max-w-lg leading-relaxed text-lg">Escolha um estilo abaixo e nós faremos igual.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-8">
        {items.length === 0 && <p className="col-span-4 text-center text-slate-500">Carregando galeria...</p>}

        {items.map((item) => (
          <div 
            key={item.id} 
            onClick={() => handleStyleSelect(item.id)}
            className={`aspect-square rounded-2xl overflow-hidden glass-card border-2 transition-all duration-300 group relative cursor-pointer shadow-2xl ${
              selectedStyleId === item.id ? 'border-red-600 ring-4 ring-red-600/10 scale-[1.02]' : 'border-white/5 hover:border-white/20'
            }`}
          >
            <img 
              src={item.url} 
              alt={item.title} 
              className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-110 ${
                selectedStyleId === item.id ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'
              }`} 
            />
            <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent p-4 flex flex-col justify-end transition-opacity duration-300 ${
              selectedStyleId === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              <span className="font-montserrat text-sm font-bold text-white uppercase">{item.title}</span>
            </div>
            
            {selectedStyleId === item.id && (
              <div className="absolute top-3 right-3 w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg animate-in fade-in">
                <i className="fas fa-check text-xs"></i>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {selectedStyleId && (
        <div className="fixed bottom-24 lg:bottom-10 left-0 right-0 z-50 flex justify-center px-4 animate-in slide-in-from-bottom-4">
          <div className="bg-slate-900/90 backdrop-blur-md border border-red-600/30 p-4 rounded-2xl shadow-2xl flex items-center gap-6 max-w-md w-full">
             <div className="flex-1">
               <span className="text-[10px] uppercase text-slate-400 block mb-1">Selecionado</span>
               <span className="font-bold text-white text-sm">
                 {items.find(i => i.id === selectedStyleId)?.title}
               </span>
             </div>
             <button 
                onClick={handleBooking}
                className="bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg"
             >
               Quero Esse
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
