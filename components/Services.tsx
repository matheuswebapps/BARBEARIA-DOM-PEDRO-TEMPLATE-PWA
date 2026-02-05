
import React, { useEffect, useState } from 'react';
import { dataProvider } from '../dataProvider';
import { ServiceItem, BusinessSettings } from '../types';
import { DEFAULT_SETTINGS } from '../constants';
import { generateSlug } from '../utils';

const Services: React.FC = () => {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const fetchData = async () => {
      const [fetchedServices, fetchedSettings] = await Promise.all([
        dataProvider.getServices(),
        dataProvider.getSettings()
      ]);
      // Filter: Must be active AND have a name (handling invisible slots)
      setServices(fetchedServices.filter(s => s.active && s.name.trim() !== ''));
      setSettings(fetchedSettings);
    };
    fetchData();
  }, []);

  const handleQuickAgendamento = (serviceName: string) => {
    const shopName = settings.name || 'Barbearia';
    const slug = generateSlug(shopName);
    
    // Using strict format for consistency
    const message = encodeURIComponent(`agendamento-${slug}\n✂️ *Agendamento – ${shopName}*\n\nOlá! Gostaria de agendar: ${serviceName}`);
    
    window.open(`https://wa.me/${settings.phone}?text=${message}`, '_blank');
  };

  return (
    <div className="p-6 pb-24 min-h-screen lg:max-w-4xl lg:mx-auto">
      <div className="text-center mb-12">
        <span className="text-[#B8860B] font-bold tracking-widest uppercase text-xs mb-2 block">Nossos Serviços</span>
        <h2 className="text-4xl md:text-5xl font-serif font-bold text-[#2C1A1D] mb-4">Tabela de Preços</h2>
        <div className="w-16 h-1 bg-[#2C1A1D] mx-auto"></div>
      </div>

      <div className="space-y-4">
        {services.length === 0 && <p className="text-center text-gray-500 font-serif italic">Carregando carta de serviços...</p>}
        
        {services.map((service) => (
          <div key={service.id} className="classic-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-[#B8860B] transition-colors">
            <div className="flex items-start gap-4">
               <div className="w-12 h-12 bg-[#FDFBF7] border border-[#E5E0D8] rounded-full flex items-center justify-center text-[#2C1A1D] group-hover:bg-[#2C1A1D] group-hover:text-[#B8860B] transition-colors">
                 <i className={`fas fa-${service.icon === 'hair' ? 'cut' : service.icon === 'beard' ? 'user' : 'star'}`}></i>
               </div>
               <div>
                 <h3 className="font-serif text-xl font-bold text-[#2C1A1D]">{service.name}</h3>
                 <p className="text-sm text-gray-500 font-sans italic">{service.description}</p>
               </div>
            </div>
            
            <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-gray-100 pt-4 md:pt-0 mt-2 md:mt-0">
               <span className="font-serif text-2xl font-bold text-[#B8860B]">R$ {service.price},00</span>
               <button 
                 onClick={() => handleQuickAgendamento(service.name)}
                 className="classic-btn px-6 py-2 text-xs font-bold uppercase tracking-wider rounded-sm"
               >
                 Agendar
               </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-[#2C1A1D] text-[#FDFBF7] p-8 rounded-sm text-center classic-card border-none">
        <h3 className="font-serif text-2xl mb-2 text-[#B8860B]">Dúvida sobre qual escolher?</h3>
        <p className="text-sm font-sans mb-6 opacity-80">Nossos barbeiros são especialistas em visagismo e podem sugerir o melhor para você.</p>
        <button className="classic-btn-outline border-[#FDFBF7] text-[#FDFBF7] hover:bg-[#FDFBF7] hover:text-[#2C1A1D] px-8 py-3 text-xs uppercase tracking-widest font-bold">
          Fale Conosco
        </button>
      </div>
    </div>
  );
};

export default Services;
