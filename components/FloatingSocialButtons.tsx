
import React from 'react';
import { BusinessSettings } from '../types';

interface FloatingSocialButtonsProps {
  activeTab: string;
  settings: BusinessSettings;
}

const FloatingSocialButtons: React.FC<FloatingSocialButtonsProps> = ({ activeTab, settings }) => {
  // 1. REGRA: Aparecer somente na aba Home
  if (activeTab !== 'home') return null;

  // 2. REGRA: Verificar se links existem
  const hasWhatsapp = !!settings.whatsappLink;
  const hasInstagram = !!settings.instagramLink;
  const hasFacebook = !!settings.facebookLink;

  // 3. REGRA: Se nenhum link estiver preenchido, não renderizar nada
  if (!hasWhatsapp && !hasInstagram && !hasFacebook) return null;

  return (
    <div className="fixed bottom-24 right-4 flex flex-col gap-3 z-30 animate-in lg:hidden">
      {hasWhatsapp && (
        <a
          href={settings.whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          aria-label="WhatsApp"
        >
          <i className="fab fa-whatsapp text-2xl"></i>
        </a>
      )}
      
      {hasInstagram && (
        <a
          href={settings.instagramLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          aria-label="Instagram"
        >
          <i className="fab fa-instagram text-2xl"></i>
        </a>
      )}

      {hasFacebook && (
        <a
          href={settings.facebookLink}
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-[#1877F2] text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
          aria-label="Facebook"
        >
          <i className="fab fa-facebook-f text-2xl"></i>
        </a>
      )}
    </div>
  );
};

export default FloatingSocialButtons;
