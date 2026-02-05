
import React from 'react';

type IconType = 'hair' | 'beard' | 'eyebrow' | 'combo' | 'default';

interface ServiceIconProps {
  type: string; // Accepts the service name or specific keys
  className?: string;
}

const ServiceIcon: React.FC<ServiceIconProps> = ({ type, className = "w-6 h-6" }) => {
  const normalizedType = type.toLowerCase();
  
  let content = null;
  
  // Logic to determine icon based on service name or ID
  if (normalizedType.includes('cabelo') || normalizedType.includes('corte') || normalizedType.includes('social')) {
    // Scissors Icon (Refined)
    content = (
      <g stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <line x1="20" y1="4" x2="8.12" y2="15.88" />
        <line x1="14.47" y1="14.48" x2="20" y2="20" />
        <line x1="8.12" y1="8.12" x2="12" y2="12" />
      </g>
    );
  } else if (normalizedType.includes('barba')) {
    // Beard + Mustache Icon
    content = (
      <g stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Mustache */}
        <path d="M7 10c1.5-2 4-2 5 0 1-2 3.5-2 5 0" />
        {/* Beard Outline */}
        <path d="M8 11v2c0 2.5 2 4 4 4s4-1.5 4-4v-2" />
      </g>
    );
  } else if (normalizedType.includes('sobrancelha')) {
    // Eyebrow + Eye Icon
    content = (
      <g stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
        {/* Eyebrow */}
        <path d="M6 7c2-2 8-2 12 0" />
        {/* Eye */}
        <path d="M4 13c2.5-3 8-3 16 0" />
        <path d="M4 13c2.5 3 8 3 16 0" />
        <circle cx="12" cy="13" r="2" fill="currentColor" stroke="none" />
      </g>
    );
  } else {
    // Default Star/Combo
    content = (
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    );
  }

  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      className={className}
    >
      {content}
    </svg>
  );
};

export default ServiceIcon;
