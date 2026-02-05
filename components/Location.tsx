
import React from 'react';
import { BusinessSettings } from '../types';

interface LocationProps {
  settings: BusinessSettings;
}

const Location: React.FC<LocationProps> = ({ settings }) => {
  return (
    <div className="p-6 pb-24 min-h-screen lg:max-w-4xl lg:mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-serif font-bold text-[#2C1A1D] mb-4">Localização</h2>
        <p className="text-gray-600">Venha nos fazer uma visita.</p>
      </div>
      
      <div className="classic-card overflow-hidden">
        {/* Map Placeholder or Image */}
        <div className="h-64 bg-[#E5E0D8] relative flex items-center justify-center">
             <i className="fas fa-map text-4xl text-[#B8860B] opacity-50"></i>
             <div className="absolute inset-0 bg-black/10"></div>
        </div>
        
        <div className="p-8 md:p-12 text-center md:text-left grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="font-serif text-2xl font-bold text-[#2C1A1D] mb-2">Endereço</h3>
            <p className="text-gray-600 mb-6 leading-relaxed font-sans">{settings.address}</p>
            
            <button 
              onClick={() => window.open(settings.googleMapsUrl || settings.mapLink, '_blank')}
              className="classic-btn px-8 py-3 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2"
            >
              <i className="fas fa-directions"></i> Abrir no Maps
            </button>
          </div>
          
          <div className="border-t md:border-t-0 md:border-l border-[#E5E0D8] pt-8 md:pt-0 md:pl-8">
            <h3 className="font-serif text-2xl font-bold text-[#2C1A1D] mb-4">Horário de Funcionamento</h3>
            <p className="text-gray-600 font-sans leading-loose whitespace-pre-line">
              {settings.openingHoursText || "Segunda a Sexta: 09:00 - 20:00\nSábado: 09:00 - 18:00"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Location;
