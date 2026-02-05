
import { ServiceType, ServiceItem, BusinessSettings, PortfolioItem, CutSuggestion, ProductItem } from './types';

export const LOGO_FALLBACK = 'https://cdn-icons-png.flaticon.com/512/3504/3504018.png';
export const BARBERSHOP_PHONE = '5511941361777';

export const DEFAULT_SETTINGS: BusinessSettings = {
  name: 'Dom Pedro',
  subtitle: 'Tradição, elegância e o verdadeiro corte clássico.',
  phone: '5511941361777',
  instagram: 'barbeariadompedro',
  address: 'Rua do Imperador, 400 - Centro Histórico, SP',
  mapLink: 'https://www.google.com/maps', // Fallback for embedded maps if implemented
  googleMapsUrl: 'https://goo.gl/maps/example',
  logoUrl: '/logo.png',
  appIconUrl: '/logo.png',
  heroImage: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1600',
  openingHoursText: 'Seg–Sex: 09h às 20h | Sáb: 09h às 18h',
  
  // Social Links defaults
  whatsappLink: 'https://wa.me/5511941361777',
  instagramLink: 'https://instagram.com/barbeariadompedro',
  facebookLink: '',

  // Global Toggles
  productsEnabled: true,
  childCutEnabled: true,

  // Home Content defaults
  heroButtonTextSchedule: 'Agendar Horário',
  heroButtonTextCuts: 'Ver Cortes',
  
  feature1Title: 'Qualidade Premium',
  feature1Description: 'Produtos selecionados e técnicas tradicionais para o homem moderno.',
  
  feature2Title: 'Pontualidade',
  feature2Description: 'Respeitamos seu tempo. Agendamento preciso e sem espera desnecessária.',
  
  feature3Title: 'Ambiente Relaxante',
  feature3Description: 'Café, conversa boa e um ambiente climatizado para você relaxar.',
  
  footerQuote: '"O estilo é a roupa do pensamento."'
};

// Main Services + Populated Extras + More Invisible Slots (+5 requested, total 20 invisible)
export const DEFAULT_SERVICES: ServiceItem[] = [
  {
    id: '1',
    name: 'Corte Clássico',
    price: 50,
    durationMinutes: 45,
    description: 'Tesoura e máquina com acabamento impecável.',
    icon: 'hair',
    active: true,
    options: [],
    isChild: false
  },
  {
    id: '2',
    name: 'Barba Real',
    price: 35,
    durationMinutes: 30,
    description: 'Toalha quente, navalha e pós-barba premium.',
    icon: 'beard',
    active: true,
    options: [],
    isChild: false
  },
  {
    id: '3',
    name: 'Combo Dom Pedro',
    price: 75,
    durationMinutes: 75,
    description: 'A experiência completa: Cabelo e Barba.',
    icon: 'combo',
    active: true,
    options: [],
    isChild: false
  },
  {
    id: '4',
    name: 'Corte Infantil',
    price: 40,
    durationMinutes: 30,
    description: 'Para os pequenos cavalheiros (até 12 anos).',
    icon: 'hair',
    active: true,
    options: [],
    isChild: true
  },
  {
    id: '5',
    name: 'Camuflagem de Grisalhos',
    price: 45,
    durationMinutes: 30,
    description: 'Tonalização sutil para reduzir fios brancos.',
    icon: 'hair',
    active: true,
    options: [],
    isChild: false
  },
  {
    id: '6',
    name: 'Acabamento (Pezinho)',
    price: 20,
    durationMinutes: 15,
    description: 'Manutenção do contorno e limpeza do pescoço.',
    icon: 'eyebrow',
    active: true,
    options: [],
    isChild: false
  },
  {
    id: '7',
    name: 'Sobrancelha',
    price: 15,
    durationMinutes: 10,
    description: 'Alinhamento na navalha ou pinça.',
    icon: 'eyebrow',
    active: true,
    options: [],
    isChild: false
  },
  // Invisible slots (Existing 10 + 5 New + 5 New Prompt = Total 20 invisible slots)
  { id: 'extra-1', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-2', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-3', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-4', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-5', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-6', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-7', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-8', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-9', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-10', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-11', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-12', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-13', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-14', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-15', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-16', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-17', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-18', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-19', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
  { id: 'extra-20', name: '', price: 0, durationMinutes: 30, description: '', icon: 'default', active: false, options: [], isChild: false },
];

export const DEFAULT_PORTFOLIO: PortfolioItem[] = []; // Deprecated, merged into Cuts

// Main Cuts + Populated Extras + More Invisible Slots
export const DEFAULT_CUTS: CutSuggestion[] = [
  { id: '1', name: 'Executive Contour', technicalName: 'Clássico Lateral', category: 'Geral', imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: '2', name: 'Pompadour', technicalName: 'Topete Alto', category: 'Geral', imageUrl: 'https://images.unsplash.com/photo-1512690196236-4074256637b5?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: '3', name: 'Slick Back', technicalName: 'Penteado para Trás', category: 'Geral', imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: '4', name: 'Americano', technicalName: 'Taper Fade', category: 'Geral', imageUrl: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: '5', name: 'Degradê Navalhado', technicalName: 'Razor Fade', category: 'Geral', imageUrl: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: '6', name: 'Militar', technicalName: 'Buzz Cut', category: 'Geral', imageUrl: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: '7', name: 'Social', technicalName: 'Clássico Tesoura', category: 'Geral', imageUrl: 'https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: '8', name: 'Black Power', technicalName: 'Nudred / Sponge', category: 'Crespo / Cacheado', imageUrl: 'https://images.unsplash.com/photo-1514059074073-677a284e937d?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: '9', name: 'Flat Top', technicalName: 'Topo Reto', category: 'Geral', imageUrl: 'https://images.unsplash.com/photo-1520338661084-680395057c93?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  
  // Invisible slots (Existing 10 + 5 New + 5 New Prompt = Total 20 invisible slots)
  { id: 'extra-c1', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c2', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c3', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c4', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c5', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c6', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c7', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c8', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c9', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c10', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c11', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c12', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c13', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c14', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c15', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c16', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c17', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c18', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c19', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
  { id: 'extra-c20', name: '', technicalName: '', category: 'Geral', imageUrl: '', active: false, options: [] },
];

// New Products Section - 10 Existing + 5 New = 15 Slots
export const DEFAULT_PRODUCTS: ProductItem[] = [
  { id: 'prod-1', name: 'Pomada Matte', description: 'Alta fixação e efeito seco.', price: 45, imageUrl: 'https://images.unsplash.com/photo-1626895360980-d66a6a235338?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: 'prod-2', name: 'Óleo para Barba', description: 'Hidratação e perfume amadeirado.', price: 35, imageUrl: 'https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: 'prod-3', name: 'Shampoo Mentolado', description: 'Limpeza profunda e refrescância.', price: 30, imageUrl: 'https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?auto=format&fit=crop&q=80&w=600', active: true, options: [] },
  { id: 'prod-4', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
  { id: 'prod-5', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
  { id: 'prod-6', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
  { id: 'prod-7', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
  { id: 'prod-8', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
  { id: 'prod-9', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
  { id: 'prod-10', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
  { id: 'prod-11', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
  { id: 'prod-12', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
  { id: 'prod-13', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
  { id: 'prod-14', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
  { id: 'prod-15', name: '', description: '', price: 0, imageUrl: '', active: false, options: [] },
];
