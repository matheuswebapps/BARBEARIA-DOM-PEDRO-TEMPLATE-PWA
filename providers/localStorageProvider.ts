
import { DataProviderInterface } from "./interfaces";
import { BusinessSettings, CutSuggestion, PortfolioItem, ServiceItem, Testimonial, ProductItem } from "../types";
import { DEFAULT_CUTS, DEFAULT_PORTFOLIO, DEFAULT_SERVICES, DEFAULT_SETTINGS, DEFAULT_PRODUCTS } from "../constants";

const STORAGE_KEYS = {
  SETTINGS: 'fio_settings',
  SERVICES: 'fio_services',
  PORTFOLIO: 'fio_portfolio',
  CUTS: 'fio_cuts',
  PRODUCTS: 'fio_products',
  TESTIMONIALS: 'fio_testimonials',
};

// Helper to simulate async delay (optional, helps find async bugs in dev)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const localStorageProvider: DataProviderInterface = {
  getSettings: async (): Promise<BusinessSettings> => {
    // await delay(100); 
    const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  },
  saveSettings: async (settings: BusinessSettings): Promise<void> => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getServices: async (): Promise<ServiceItem[]> => {
    const stored = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return stored ? JSON.parse(stored) : DEFAULT_SERVICES;
  },
  saveServices: async (services: ServiceItem[]): Promise<void> => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  },

  getPortfolio: async (): Promise<PortfolioItem[]> => {
    const stored = localStorage.getItem(STORAGE_KEYS.PORTFOLIO);
    return stored ? JSON.parse(stored) : DEFAULT_PORTFOLIO;
  },
  savePortfolio: async (items: PortfolioItem[]): Promise<void> => {
    localStorage.setItem(STORAGE_KEYS.PORTFOLIO, JSON.stringify(items));
  },

  getCuts: async (): Promise<CutSuggestion[]> => {
    const stored = localStorage.getItem(STORAGE_KEYS.CUTS);
    return stored ? JSON.parse(stored) : DEFAULT_CUTS;
  },
  saveCuts: async (items: CutSuggestion[]): Promise<void> => {
    localStorage.setItem(STORAGE_KEYS.CUTS, JSON.stringify(items));
  },

  getProducts: async (): Promise<ProductItem[]> => {
    const stored = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return stored ? JSON.parse(stored) : DEFAULT_PRODUCTS;
  },
  saveProducts: async (items: ProductItem[]): Promise<void> => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(items));
  },

  getTestimonials: async (): Promise<Testimonial[]> => {
    const stored = localStorage.getItem(STORAGE_KEYS.TESTIMONIALS);
    return stored ? JSON.parse(stored) : [];
  },
  saveTestimonials: async (items: Testimonial[]): Promise<void> => {
    localStorage.setItem(STORAGE_KEYS.TESTIMONIALS, JSON.stringify(items));
  }
};
