
import { BusinessSettings, CutSuggestion, PortfolioItem, ServiceItem, Testimonial, ProductItem } from "../types";

export interface DataProviderInterface {
  // Settings
  getSettings(): Promise<BusinessSettings>;
  saveSettings(settings: BusinessSettings): Promise<void>;

  // Services
  getServices(): Promise<ServiceItem[]>;
  saveServices(services: ServiceItem[]): Promise<void>;

  // Portfolio
  getPortfolio(): Promise<PortfolioItem[]>;
  savePortfolio(items: PortfolioItem[]): Promise<void>;

  // Cuts
  getCuts(): Promise<CutSuggestion[]>;
  saveCuts(items: CutSuggestion[]): Promise<void>;

  // Products
  getProducts(): Promise<ProductItem[]>;
  saveProducts(items: ProductItem[]): Promise<void>;

  // Testimonials (Optional/Future)
  getTestimonials(): Promise<Testimonial[]>;
  saveTestimonials(items: Testimonial[]): Promise<void>;
}
