import { DataProviderInterface } from './interfaces';
import type {
  BusinessSettings,
  CutSuggestion,
  PortfolioItem,
  ProductItem,
  ServiceItem,
  Testimonial,
} from '../types';
import {
  DEFAULT_CUTS,
  DEFAULT_PORTFOLIO,
  DEFAULT_PRODUCTS,
  DEFAULT_SERVICES,
  DEFAULT_SETTINGS,
} from '../constants';
import { SITE_KEY, getSupabase } from '../services/supabaseClient';

// Notes:
// - The UI uses camelCase fields (types.ts).
// - The DB schema uses snake_case (supabase.sql).
// - This provider must map between them. If we return snake_case to the UI,
//   inputs become undefined (controlled/uncontrolled warnings) and lists "disappear".

type DbRow = Record<string, any>;
type Row<T> = Record<string, any> & { site_key: string; id?: string; sort_order?: number | null };

const isNonEmptyString = (v: any) => typeof v === 'string' && v.trim().length > 0;
const safeArray = (v: any): string[] => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);
const safeBool = (v: any, fallback: boolean) => (typeof v === 'boolean' ? v : fallback);
const safeInt = (v: any, fallback: number) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

const ensureId = (id: any): string => {
  if (isNonEmptyString(id)) return String(id);
  // Browser-safe id
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyCrypto: any = (globalThis as any).crypto;
  if (anyCrypto?.randomUUID) return anyCrypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

/**
 * Upsert items safely.
 * IMPORTANT: We do NOT hard-delete missing rows automatically.
 * That behavior caused accidental mass-deletions when the UI had temporary/blank ids.
 * Instead, we soft-disable missing rows by setting active=false (where supported).
 */
const upsertManySafe = async (
  table: string,
  items: Array<Row<any>>,
  opts: { hasActive: boolean }
): Promise<void> => {
  const supabase = getSupabase();

  // Normalize ids and sort_order
  const normalized = items.map((it, i) => ({
    ...it,
    id: ensureId(it.id),
    site_key: SITE_KEY,
    sort_order: typeof it.sort_order === 'number' ? it.sort_order : i,
  }));

  // Soft-disable rows that are no longer present in the UI list (if table has active)
  if (opts.hasActive) {
    const { data: existing, error: existingErr } = await supabase
      .from(table)
      .select('id')
      .eq('site_key', SITE_KEY);
    if (existingErr) throw existingErr;

    const incomingIds = new Set(normalized.map((x) => String(x.id)));
    const existingIds = (existing || []).map((r: any) => String(r.id));
    const toDisable = existingIds.filter((id) => !incomingIds.has(id));

    if (toDisable.length > 0) {
      const { error: updErr } = await supabase
        .from(table)
        .update({ active: false })
        .eq('site_key', SITE_KEY)
        .in('id', toDisable);
      if (updErr) throw updErr;
    }
  }

  if (normalized.length === 0) return;

  const { error } = await supabase.from(table).upsert(normalized, { onConflict: 'site_key,id' });
  if (error) throw error;
};

// -----------------------
// Mappers (DB -> UI)
// -----------------------

const mapSettingsFromDb = (row: DbRow): BusinessSettings => {
  // Prefer snake_case (official schema). If the project previously created camelCase columns,
  // we still accept them as fallback.
  const s: BusinessSettings = {
    ...DEFAULT_SETTINGS,

    name: row.name ?? DEFAULT_SETTINGS.name,
    subtitle: row.subtitle ?? DEFAULT_SETTINGS.subtitle,
    phone: row.phone ?? DEFAULT_SETTINGS.phone,
    instagram: row.instagram ?? DEFAULT_SETTINGS.instagram,
    address: row.address ?? DEFAULT_SETTINGS.address,

    mapLink: row.map_link ?? row.mapLink ?? DEFAULT_SETTINGS.mapLink,
    googleMapsUrl: row.google_maps_url ?? row.googleMapsUrl ?? DEFAULT_SETTINGS.googleMapsUrl,

    logoUrl: row.logo_url ?? row.logoUrl ?? DEFAULT_SETTINGS.logoUrl,
    appIconUrl: row.app_icon_url ?? row.appIconUrl ?? DEFAULT_SETTINGS.appIconUrl,
    heroImage: row.hero_image ?? row.heroImage ?? DEFAULT_SETTINGS.heroImage,
    openingHoursText:
      row.opening_hours_text ?? row.openingHoursText ?? DEFAULT_SETTINGS.openingHoursText,

    whatsappLink: row.whatsapp_link ?? row.whatsappLink ?? DEFAULT_SETTINGS.whatsappLink,
    instagramLink: row.instagram_link ?? row.instagramLink ?? DEFAULT_SETTINGS.instagramLink,
    facebookLink: row.facebook_link ?? row.facebookLink ?? DEFAULT_SETTINGS.facebookLink,

    productsEnabled: safeBool(row.products_enabled ?? row.productsEnabled, DEFAULT_SETTINGS.productsEnabled),
    childCutEnabled: safeBool(row.child_cut_enabled ?? row.childCutEnabled, DEFAULT_SETTINGS.childCutEnabled),

    heroButtonTextSchedule:
      row.hero_button_text_schedule ?? row.heroButtonTextSchedule ?? DEFAULT_SETTINGS.heroButtonTextSchedule,
    heroButtonTextCuts:
      row.hero_button_text_cuts ?? row.heroButtonTextCuts ?? DEFAULT_SETTINGS.heroButtonTextCuts,

    feature1Title: row.feature1_title ?? row.feature1Title ?? DEFAULT_SETTINGS.feature1Title,
    feature1Description:
      row.feature1_description ?? row.feature1Description ?? DEFAULT_SETTINGS.feature1Description,

    feature2Title: row.feature2_title ?? row.feature2Title ?? DEFAULT_SETTINGS.feature2Title,
    feature2Description:
      row.feature2_description ?? row.feature2Description ?? DEFAULT_SETTINGS.feature2Description,

    feature3Title: row.feature3_title ?? row.feature3Title ?? DEFAULT_SETTINGS.feature3Title,
    feature3Description:
      row.feature3_description ?? row.feature3Description ?? DEFAULT_SETTINGS.feature3Description,

    footerQuote: row.footer_quote ?? row.footerQuote ?? DEFAULT_SETTINGS.footerQuote,
  };

  // Ensure controlled inputs never receive undefined
  Object.keys(s).forEach((k) => {
    // @ts-expect-error index
    if (s[k] === undefined || s[k] === null) s[k] = (DEFAULT_SETTINGS as any)[k] ?? '';
  });
  return s;
};

const mapSettingsToDb = (s: BusinessSettings): DbRow => ({
  site_key: SITE_KEY,
  name: s.name,
  subtitle: s.subtitle,
  phone: s.phone,
  instagram: s.instagram,
  address: s.address,
  map_link: s.mapLink,
  google_maps_url: s.googleMapsUrl,
  logo_url: s.logoUrl,
  app_icon_url: s.appIconUrl,
  hero_image: s.heroImage,
  opening_hours_text: s.openingHoursText,
  whatsapp_link: s.whatsappLink,
  instagram_link: s.instagramLink,
  facebook_link: s.facebookLink,
  products_enabled: s.productsEnabled,
  child_cut_enabled: s.childCutEnabled,
  hero_button_text_schedule: s.heroButtonTextSchedule,
  hero_button_text_cuts: s.heroButtonTextCuts,
  feature1_title: s.feature1Title,
  feature1_description: s.feature1Description,
  feature2_title: s.feature2Title,
  feature2_description: s.feature2Description,
  feature3_title: s.feature3Title,
  feature3_description: s.feature3Description,
  footer_quote: s.footerQuote,
});

const mapServiceFromDb = (row: DbRow): ServiceItem => ({
  id: ensureId(row.id),
  name: row.name ?? '',
  price: safeInt(row.price, 0),
  durationMinutes: safeInt(row.duration_minutes ?? row.durationMinutes, 30),
  description: row.description ?? '',
  icon: row.icon ?? 'default',
  active: safeBool(row.active, true),
  options: safeArray(row.options),
  isChild: safeBool(row.is_child ?? row.isChild, false),
  notForChildren: safeBool(row.not_for_children ?? row.notForChildren, false),
});

const mapServiceToDb = (s: ServiceItem, sort: number): DbRow => ({
  site_key: SITE_KEY,
  id: ensureId(s.id),
  name: s.name ?? '',
  price: safeInt(s.price, 0),
  duration_minutes: safeInt(s.durationMinutes, 30),
  description: s.description ?? '',
  icon: s.icon ?? 'default',
  active: safeBool(s.active, true),
  options: safeArray(s.options),
  is_child: safeBool(s.isChild, false),
  not_for_children: safeBool(s.notForChildren, false),
  sort_order: sort,
});

const mapCutFromDb = (row: DbRow): CutSuggestion => ({
  id: ensureId(row.id),
  name: row.name ?? '',
  technicalName: row.technical_name ?? row.technicalName ?? '',
  category: (row.category ?? 'Geral') as any,
  imageUrl: row.image_url ?? row.imageUrl ?? '',
  active: safeBool(row.active, true),
  options: safeArray(row.options),
});

const mapCutToDb = (c: CutSuggestion, sort: number): DbRow => ({
  site_key: SITE_KEY,
  id: ensureId(c.id),
  name: c.name ?? '',
  technical_name: c.technicalName ?? '',
  category: c.category ?? 'Geral',
  image_url: c.imageUrl ?? '',
  active: safeBool(c.active, true),
  options: safeArray(c.options),
  sort_order: sort,
});

const mapProductFromDb = (row: DbRow): ProductItem => ({
  id: ensureId(row.id),
  name: row.name ?? '',
  description: row.description ?? '',
  price: safeInt(row.price, 0),
  imageUrl: row.image_url ?? row.imageUrl ?? '',
  active: safeBool(row.active, true),
  options: safeArray(row.options),
  notForChildren: safeBool(row.not_for_children ?? row.notForChildren, false),
});

const mapProductToDb = (p: ProductItem, sort: number): DbRow => ({
  site_key: SITE_KEY,
  id: ensureId(p.id),
  name: p.name ?? '',
  description: p.description ?? '',
  price: safeInt(p.price, 0),
  image_url: p.imageUrl ?? '',
  active: safeBool(p.active, true),
  options: safeArray(p.options),
  not_for_children: safeBool(p.notForChildren, false),
  sort_order: sort,
});

const mapPortfolioFromDb = (row: DbRow): PortfolioItem => ({
  id: ensureId(row.id),
  url: row.url ?? '',
  title: row.title ?? '',
  active: safeBool(row.active, true),
});

const mapPortfolioToDb = (p: PortfolioItem, sort: number): DbRow => ({
  site_key: SITE_KEY,
  id: ensureId(p.id),
  url: p.url ?? '',
  title: p.title ?? '',
  active: safeBool(p.active, true),
  sort_order: sort,
});

const mapTestimonialFromDb = (row: DbRow): Testimonial => ({
  id: ensureId(row.id),
  clientName: row.client_name ?? row.clientName ?? '',
  comment: row.comment ?? '',
  rating: safeInt(row.rating, 5),
  active: safeBool(row.active, true),
});

const mapTestimonialToDb = (t: Testimonial, sort: number): DbRow => ({
  site_key: SITE_KEY,
  id: ensureId(t.id),
  client_name: t.clientName ?? '',
  comment: t.comment ?? '',
  rating: safeInt(t.rating, 5),
  active: safeBool(t.active, true),
  sort_order: sort,
});

// -----------------------
// Provider
// -----------------------

export const supabaseProvider: DataProviderInterface = {
  // SETTINGS
  getSettings: async (): Promise<BusinessSettings> => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('shop_settings')
      .select('*')
      .eq('site_key', SITE_KEY)
      .maybeSingle();

    if (error || !data) {
      if (error) console.warn('[supabaseProvider] getSettings failed:', error);
      return { ...DEFAULT_SETTINGS };
    }
    return mapSettingsFromDb(data as any);
  },
  saveSettings: async (settings: BusinessSettings): Promise<void> => {
    const supabase = getSupabase();
    const payload = mapSettingsToDb(settings);
    const { error } = await supabase.from('shop_settings').upsert(payload, { onConflict: 'site_key' });
    if (error) throw error;
  },

  // SERVICES
  getServices: async (): Promise<ServiceItem[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('site_key', SITE_KEY)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });
    if (error || !data) {
      if (error) console.warn('[supabaseProvider] getServices failed:', error);
      return DEFAULT_SERVICES.map((x) => ({ ...x }));
    }
    return (data as any[]).map(mapServiceFromDb);
  },
  saveServices: async (services: ServiceItem[]): Promise<void> => {
    const payload = services.map((s, i) => mapServiceToDb(s, i));
    await upsertManySafe('services', payload, { hasActive: true });
  },

  // PORTFOLIO
  getPortfolio: async (): Promise<PortfolioItem[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('portfolio_items')
      .select('*')
      .eq('site_key', SITE_KEY)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });
    if (error || !data) {
      if (error) console.warn('[supabaseProvider] getPortfolio failed:', error);
      return DEFAULT_PORTFOLIO.map((x) => ({ ...x }));
    }
    return (data as any[]).map(mapPortfolioFromDb);
  },
  savePortfolio: async (items: PortfolioItem[]): Promise<void> => {
    const payload = items.map((p, i) => mapPortfolioToDb(p, i));
    await upsertManySafe('portfolio_items', payload, { hasActive: true });
  },

  // CUTS
  getCuts: async (): Promise<CutSuggestion[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('cuts')
      .select('*')
      .eq('site_key', SITE_KEY)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });
    if (error || !data) {
      if (error) console.warn('[supabaseProvider] getCuts failed:', error);
      return DEFAULT_CUTS.map((x) => ({ ...x }));
    }
    return (data as any[]).map(mapCutFromDb);
  },
  saveCuts: async (items: CutSuggestion[]): Promise<void> => {
    const payload = items.map((c, i) => mapCutToDb(c, i));
    await upsertManySafe('cuts', payload, { hasActive: true });
  },

  // PRODUCTS
  getProducts: async (): Promise<ProductItem[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('site_key', SITE_KEY)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });
    if (error || !data) {
      if (error) console.warn('[supabaseProvider] getProducts failed:', error);
      return DEFAULT_PRODUCTS.map((x) => ({ ...x }));
    }
    return (data as any[]).map(mapProductFromDb);
  },
  saveProducts: async (items: ProductItem[]): Promise<void> => {
    const payload = items.map((p, i) => mapProductToDb(p, i));
    await upsertManySafe('products', payload, { hasActive: true });
  },

  // TESTIMONIALS
  getTestimonials: async (): Promise<Testimonial[]> => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('site_key', SITE_KEY)
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true });
    if (error || !data) {
      if (error) console.warn('[supabaseProvider] getTestimonials failed:', error);
      return [];
    }
    return (data as any[]).map(mapTestimonialFromDb);
  },
  saveTestimonials: async (items: Testimonial[]): Promise<void> => {
    const payload = items.map((t, i) => mapTestimonialToDb(t, i));
    await upsertManySafe('testimonials', payload, { hasActive: true });
  },
};
