
export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  description: string;
  icon: string;
  active: boolean;
  options?: string[]; // Sub-options (e.g., specific variations)
  isChild?: boolean; // Determines if this service triggers child fields
  notForChildren?: boolean; // New: Hides this service if a child service is selected
}

export interface PortfolioItem {
  id: string;
  url: string;
  title: string;
  active: boolean;
}

export interface CutSuggestion {
  id: string;
  name: string;
  technicalName: string;
  category: 'Liso / Ondulado' | 'Crespo / Cacheado' | 'Geral';
  imageUrl: string;
  active: boolean;
  options?: string[]; // Sub-options
}

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  active: boolean;
  options?: string[]; // Sub-options
  notForChildren?: boolean; // New: Hides this product if a child service is selected
}

export interface BusinessSettings {
  name: string;
  subtitle: string;
  phone: string;
  instagram: string; // Keep for backward compatibility or display
  address: string;
  mapLink: string; // Google Maps URL (view)
  googleMapsUrl: string; // Google Maps URL (action/link)
  logoUrl: string;
  appIconUrl: string; // PWA Icon
  heroImage: string;
  openingHoursText: string;

  // Social Media Links
  whatsappLink: string;
  instagramLink: string;
  facebookLink: string;

  // Global Toggles
  productsEnabled: boolean;
  childCutEnabled: boolean;

  // Home Page Editable Content
  heroButtonTextSchedule: string;
  heroButtonTextCuts: string;
  
  feature1Title: string;
  feature1Description: string;
  
  feature2Title: string;
  feature2Description: string;
  
  feature3Title: string;
  feature3Description: string;
  
  footerQuote: string;
}

export interface Testimonial {
  id: string;
  clientName: string;
  comment: string;
  rating: number; // 1 to 5
  active: boolean;
}

export interface Appointment {
  services: ServiceItem[];
  products: ProductItem[]; // Added products
  dayType: string | null;
  specificDate: string | null;
  time: string | null;
  clientName: string;
}

export enum DayType {
  HOJE = 'Hoje',
  AMANHA = 'Amanhã',
  OUTRO = 'Outro dia'
}

export enum ServiceType {
  CORTE = 'Corte Clássico',
  BARBA = 'Barba Tradicional',
  SOBRANCELHA = 'Acabamento',
  OUTRO = 'Outro'
}
