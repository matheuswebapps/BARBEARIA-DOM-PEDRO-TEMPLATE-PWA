
import React, { useEffect, useState } from 'react';
import { BusinessSettings } from '../types';

interface HomeProps {
  onNavigate: (tab: string) => void;
  settings: BusinessSettings;
}

const Home: React.FC<HomeProps> = ({ onNavigate, settings }) => {
  const [logoOk, setLogoOk] = useState(true);
  // reset the logo error state when the URL changes
  useEffect(() => {
    setLogoOk(true);
  }, [settings.logoUrl]);

  return (
    <div className="flex flex-col min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center overflow-hidden border-b-8 border-[#2C1A1D]">
        {/* Background Image with Admin Setting */}
        <div className="absolute inset-0 z-0">
          <img 
            src={settings.heroImage} 
            alt="Ambiente da Barbearia" 
            className="w-full h-full object-cover"
            onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1600'; }}
          />
          {/* Overlay - Warm/Sepia tone for vintage look */}
          <div className="absolute inset-0 bg-[#2C1A1D] opacity-60 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#2C1A1D] to-transparent opacity-90"></div>
        </div>
        
        <div className="relative z-10 w-full px-6 text-center max-w-4xl mx-auto">
          {/* Brand mark (Logo uses the crown slot; crown stays on top) */}
          <div className="mb-6 inline-block">
            <div className="relative inline-flex items-center justify-center">
              {/* Logo image (optional) */}
              {settings.logoUrl && logoOk ? (
                <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center overflow-visible">
                  <img
                    src={settings.logoUrl}
                    alt="Logo"
                    className="w-full h-full object-contain"
                    onError={() => {
                      // If the uploaded URL breaks, remove the logo box entirely (keep the crown)
                      setLogoOk(false);
                    }}
                  />
                </div>
              ) : (
                // No logo: keep the original crown-only look (no extra box)
                <span className="sr-only">Logo não configurada</span>
              )}

              {/* Crown overlay (always visible, sits over photo/logo) */}
              <i
                className={`fas fa-crown text-[#B8860B] drop-shadow-md pointer-events-none ${
                  settings.logoUrl && logoOk ? 'text-3xl md:text-4xl absolute -top-3 md:-top-4' : 'text-4xl mb-4'
                }`}
              ></i>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-bold text-[#FDFBF7] mb-6 drop-shadow-lg tracking-wide">
            {settings.name}
          </h1>
          
          <div className="h-px w-32 bg-[#B8860B] mx-auto mb-8"></div>
          
          <p className="text-[#E5E0D8] font-sans text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed tracking-wide font-light">
            {settings.subtitle}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <button 
              onClick={() => onNavigate('schedule')}
              className="classic-btn px-10 py-4 text-sm font-bold uppercase tracking-[0.2em] shadow-lg transform hover:-translate-y-1"
            >
              {settings.heroButtonTextSchedule || 'Agendar Horário'}
            </button>
            <button 
              onClick={() => onNavigate('suggestions')}
              className="px-10 py-4 border border-[#FDFBF7] text-[#FDFBF7] hover:bg-[#FDFBF7] hover:text-[#2C1A1D] transition-all text-sm font-bold uppercase tracking-[0.2em]"
            >
              {settings.heroButtonTextCuts || 'Ver Cortes'}
            </button>
          </div>
        </div>
      </section>

      {/* Featured Section - Now using dynamic text */}
      <section className="px-6 -mt-16 relative z-20">
        <div className="grid md:grid-cols-3 gap-6 desktop-container">
          <div className="classic-card p-8 text-center transform hover:-translate-y-2 transition-transform duration-300">
            <div className="w-16 h-16 bg-[#2C1A1D] rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[#B8860B]">
              <i className="fas fa-gem text-[#B8860B] text-2xl"></i>
            </div>
            <h3 className="font-serif text-2xl text-[#2C1A1D] mb-3">{settings.feature1Title || 'Qualidade Premium'}</h3>
            <p className="text-gray-600 text-sm leading-relaxed font-sans">
              {settings.feature1Description || 'Produtos selecionados e técnicas tradicionais para o homem moderno.'}
            </p>
          </div>
          
          <div className="classic-card p-8 text-center transform hover:-translate-y-2 transition-transform duration-300 border-t-4 border-t-[#B8860B]">
            <div className="w-16 h-16 bg-[#2C1A1D] rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[#B8860B]">
              <i className="fas fa-clock text-[#B8860B] text-2xl"></i>
            </div>
            <h3 className="font-serif text-2xl text-[#2C1A1D] mb-3">{settings.feature2Title || 'Pontualidade'}</h3>
            <p className="text-gray-600 text-sm leading-relaxed font-sans">
              {settings.feature2Description || 'Respeitamos seu tempo. Agendamento preciso e sem espera desnecessária.'}
            </p>
          </div>

          <div className="classic-card p-8 text-center transform hover:-translate-y-2 transition-transform duration-300">
            <div className="w-16 h-16 bg-[#2C1A1D] rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-[#B8860B]">
              <i className="fas fa-mug-hot text-[#B8860B] text-2xl"></i>
            </div>
            <h3 className="font-serif text-2xl text-[#2C1A1D] mb-3">{settings.feature3Title || 'Ambiente Relaxante'}</h3>
            <p className="text-gray-600 text-sm leading-relaxed font-sans">
              {settings.feature3Description || 'Café, conversa boa e um ambiente climatizado para você relaxar.'}
            </p>
          </div>
        </div>
      </section>
      
      <div className="text-center mt-12 mb-8">
        <p className="font-serif italic text-[#B8860B] text-xl">{settings.footerQuote || '"O estilo é a roupa do pensamento."'}</p>
      </div>
    </div>
  );
};

export default Home;
