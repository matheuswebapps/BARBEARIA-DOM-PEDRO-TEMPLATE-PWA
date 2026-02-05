-- Barbearia Template (SELLABLE) - Supabase SQL (FULL)
-- Run in Supabase SQL Editor.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Core tables
create table if not exists public.shop_settings (
  site_key text primary key,
  name text not null,
  subtitle text not null,
  phone text not null,
  instagram text not null,
  address text not null,
  map_link text not null,
  google_maps_url text not null,
  logo_url text not null,
  app_icon_url text not null,
  hero_image text not null,
  opening_hours_text text not null,
  whatsapp_link text not null,
  instagram_link text not null,
  facebook_link text not null default '',
  products_enabled boolean not null default true,
  child_cut_enabled boolean not null default true,
  hero_button_text_schedule text not null,
  hero_button_text_cuts text not null,
  feature1_title text not null,
  feature1_description text not null,
  feature2_title text not null,
  feature2_description text not null,
  feature3_title text not null,
  feature3_description text not null,
  footer_quote text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  site_key text not null,
  id text not null,
  name text not null,
  price integer not null default 0,
  duration_minutes integer not null default 30,
  description text not null default '',
  icon text not null default 'default',
  active boolean not null default true,
  options text[] not null default '{}'::text[],
  is_child boolean not null default false,
  not_for_children boolean not null default false,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (site_key, id)
);

create table if not exists public.cuts (
  site_key text not null,
  id text not null,
  name text not null,
  technical_name text not null default '',
  category text not null default 'Geral',
  image_url text not null default '',
  active boolean not null default true,
  options text[] not null default '{}'::text[],
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (site_key, id)
);

create table if not exists public.products (
  site_key text not null,
  id text not null,
  name text not null,
  description text not null default '',
  price integer not null default 0,
  image_url text not null default '',
  active boolean not null default true,
  options text[] not null default '{}'::text[],
  not_for_children boolean not null default false,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (site_key, id)
);

create table if not exists public.portfolio_items (
  site_key text not null,
  id text not null,
  url text not null,
  title text not null default '',
  active boolean not null default true,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (site_key, id)
);

create table if not exists public.testimonials (
  site_key text not null,
  id text not null,
  client_name text not null,
  comment text not null,
  rating integer not null default 5,
  active boolean not null default true,
  sort_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (site_key, id)
);

-- Triggers
DO $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_shop_settings_updated_at') then
    create trigger trg_shop_settings_updated_at before update on public.shop_settings
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_services_updated_at') then
    create trigger trg_services_updated_at before update on public.services
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_cuts_updated_at') then
    create trigger trg_cuts_updated_at before update on public.cuts
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_products_updated_at') then
    create trigger trg_products_updated_at before update on public.products
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_portfolio_updated_at') then
    create trigger trg_portfolio_updated_at before update on public.portfolio_items
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_testimonials_updated_at') then
    create trigger trg_testimonials_updated_at before update on public.testimonials
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- RLS
alter table public.shop_settings enable row level security;
alter table public.services enable row level security;
alter table public.cuts enable row level security;
alter table public.products enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.testimonials enable row level security;

-- Public read
-- Public read (DROP/CREATE to avoid syntax issues in Postgres)
DROP POLICY IF EXISTS "public_read_settings" ON public.shop_settings;
CREATE POLICY "public_read_settings" ON public.shop_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_services" ON public.services;
CREATE POLICY "public_read_services" ON public.services FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_cuts" ON public.cuts;
CREATE POLICY "public_read_cuts" ON public.cuts FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_products" ON public.products;
CREATE POLICY "public_read_products" ON public.products FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_portfolio" ON public.portfolio_items;
CREATE POLICY "public_read_portfolio" ON public.portfolio_items FOR SELECT USING (true);

DROP POLICY IF EXISTS "public_read_testimonials" ON public.testimonials;
CREATE POLICY "public_read_testimonials" ON public.testimonials FOR SELECT USING (true);

-- Authenticated write
DROP POLICY IF EXISTS "auth_write_settings" ON public.shop_settings;
CREATE POLICY "auth_write_settings" ON public.shop_settings
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "auth_write_services" ON public.services;
CREATE POLICY "auth_write_services" ON public.services
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "auth_write_cuts" ON public.cuts;
CREATE POLICY "auth_write_cuts" ON public.cuts
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "auth_write_products" ON public.products;
CREATE POLICY "auth_write_products" ON public.products
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "auth_write_portfolio" ON public.portfolio_items;
CREATE POLICY "auth_write_portfolio" ON public.portfolio_items
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "auth_write_testimonials" ON public.testimonials;
CREATE POLICY "auth_write_testimonials" ON public.testimonials
FOR ALL USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Storage buckets used by the template
-- (Your .env uses VITE_SUPABASE_STORAGE_BUCKET=site_assets)
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public)
VALUES ('site_assets', 'site_assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage policies (read for everyone, write for authenticated)
DROP POLICY IF EXISTS "public_read_objects" ON storage.objects;
CREATE POLICY "public_read_objects" ON storage.objects
FOR SELECT USING (bucket_id IN ('public','site_assets'));

DROP POLICY IF EXISTS "auth_write_objects" ON storage.objects;
CREATE POLICY "auth_write_objects" ON storage.objects
FOR ALL USING (bucket_id IN ('public','site_assets') AND auth.role() = 'authenticated')
WITH CHECK (bucket_id IN ('public','site_assets') AND auth.role() = 'authenticated');

-- Seeds
INSERT INTO public.shop_settings (
  site_key,
  name, subtitle, phone, instagram, address, map_link, google_maps_url,
  logo_url, app_icon_url, hero_image, opening_hours_text,
  whatsapp_link, instagram_link, facebook_link,
  products_enabled, child_cut_enabled,
  hero_button_text_schedule, hero_button_text_cuts,
  feature1_title, feature1_description,
  feature2_title, feature2_description,
  feature3_title, feature3_description,
  footer_quote
) VALUES (
  'default',
  'Dom Pedro',
  'Tradição, elegância e o verdadeiro corte clássico.',
  '5511941361777',
  'barbeariadompedro',
  'Rua do Imperador, 400 - Centro Histórico, SP',
  'https://www.google.com/maps',
  'https://goo.gl/maps/example',
  '/logo.png',
  '/logo.png',
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1600',
  'Seg–Sex: 09h às 20h | Sáb: 09h às 18h',
  'https://wa.me/5511941361777',
  'https://instagram.com/barbeariadompedro',
  '',
  true,
  true,
  'Agendar Horário',
  'Ver Cortes',
  'Qualidade Premium',
  'Produtos selecionados e técnicas tradicionais para o homem moderno.',
  'Pontualidade',
  'Respeitamos seu tempo. Agendamento preciso e sem espera desnecessária.',
  'Ambiente Relaxante',
  'Café, conversa boa e um ambiente climatizado para você relaxar.',
  '"O estilo é a roupa do pensamento."'
)
ON CONFLICT (site_key) DO UPDATE SET
  name = EXCLUDED.name,
  subtitle = EXCLUDED.subtitle,
  phone = EXCLUDED.phone,
  instagram = EXCLUDED.instagram,
  address = EXCLUDED.address,
  map_link = EXCLUDED.map_link,
  google_maps_url = EXCLUDED.google_maps_url,
  logo_url = EXCLUDED.logo_url,
  app_icon_url = EXCLUDED.app_icon_url,
  hero_image = EXCLUDED.hero_image,
  opening_hours_text = EXCLUDED.opening_hours_text,
  whatsapp_link = EXCLUDED.whatsapp_link,
  instagram_link = EXCLUDED.instagram_link,
  facebook_link = EXCLUDED.facebook_link,
  products_enabled = EXCLUDED.products_enabled,
  child_cut_enabled = EXCLUDED.child_cut_enabled,
  hero_button_text_schedule = EXCLUDED.hero_button_text_schedule,
  hero_button_text_cuts = EXCLUDED.hero_button_text_cuts,
  feature1_title = EXCLUDED.feature1_title,
  feature1_description = EXCLUDED.feature1_description,
  feature2_title = EXCLUDED.feature2_title,
  feature2_description = EXCLUDED.feature2_description,
  feature3_title = EXCLUDED.feature3_title,
  feature3_description = EXCLUDED.feature3_description,
  footer_quote = EXCLUDED.footer_quote,
  updated_at = now();


INSERT INTO public.services (site_key, id, name, price, duration_minutes, description, icon, active, options, is_child, not_for_children)
VALUES
  ('default','1','Corte Clássico',50,45,'Tesoura e máquina com acabamento impecável.','hair',true,ARRAY[]::text[],false,false),
  ('default','2','Barba Real',35,30,'Toalha quente, navalha e pós-barba premium.','beard',true,ARRAY[]::text[],false,false),
  ('default','3','Combo Dom Pedro',75,75,'A experiência completa: Cabelo e Barba.','combo',true,ARRAY[]::text[],false,false),
  ('default','4','Corte Infantil',40,30,'Para os pequenos cavalheiros (até 12 anos).','hair',true,ARRAY[]::text[],true,false),
  ('default','5','Camuflagem de Grisalhos',45,30,'Tonalização sutil para reduzir fios brancos.','hair',true,ARRAY[]::text[],false,false),
  ('default','6','Acabamento (Pezinho)',20,15,'Manutenção do contorno e limpeza do pescoço.','eyebrow',true,ARRAY[]::text[],false,false),
  ('default','7','Sobrancelha',15,10,'Alinhamento na navalha ou pinça.','eyebrow',true,ARRAY[]::text[],false,false),
  ('default','extra-1','',0,30,'','default',false,ARRAY[]::text[],false,false),
  ('default','extra-2','',0,30,'','default',false,ARRAY[]::text[],false,false),
  ('default','extra-3','',0,30,'','default',false,ARRAY[]::text[],false,false),
  ('default','extra-4','',0,30,'','default',false,ARRAY[]::text[],false,false),
  ('default','extra-5','',0,30,'','default',false,ARRAY[]::text[],false,false),
  ('default','extra-6','',0,30,'','default',false,ARRAY[]::text[],false,false),
  ('default','extra-7','',0,30,'','default',false,ARRAY[]::text[],false,false),
  ('default','extra-8','',0,30,'','default',false,ARRAY[]::text[],false,false),
  ('default','extra-9','',0,30,'','default',false,ARRAY[]::text[],false,false),
  ('default','extra-10','',0,30,'','default',false,ARRAY[]::text[],false,false),
  ('default','extra-11','',0,30,'','default',false,ARRAY[]::text[],false,false),
  ('default','extra-12','',0,30,'','default',false,ARRAY[]::text[],false,false),
  ('default','extra-13','',0,30,'','default',false,ARRAY[]::text[],false,false),
  ('default','extra-14','',0,30,'','default',false,ARRAY[]::text[],false,false),
  ('default','extra-15','',0,30,'','default',false,ARRAY[]::text[],false,false),
  ('default','extra-16','',0,30,'','default',false,ARRAY[]::text[],false,false),
  ('default','extra-17','',0,30,'','default',false,ARRAY[]::text[],false,false),
  ('default','extra-18','',0,30,'','default',false,ARRAY[]::text[],false,false),
  ('default','extra-19','',0,30,'','default',false,ARRAY[]::text[],false,false),
  ('default','extra-20','',0,30,'','default',false,ARRAY[]::text[],false,false)
ON CONFLICT (site_key, id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  duration_minutes = EXCLUDED.duration_minutes,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  active = EXCLUDED.active,
  options = EXCLUDED.options,
  is_child = EXCLUDED.is_child,
  not_for_children = EXCLUDED.not_for_children,
  updated_at = now();


INSERT INTO public.cuts (site_key, id, name, technical_name, category, image_url, active, options)
VALUES
  ('default','1','Executive Contour','Clássico Lateral','Geral','https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=600',true,ARRAY[]::text[]),
  ('default','2','Pompadour','Topete Alto','Geral','https://images.unsplash.com/photo-1512690196236-4074256637b5?auto=format&fit=crop&q=80&w=600',true,ARRAY[]::text[]),
  ('default','3','Slick Back','Penteado para Trás','Geral','https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=600',true,ARRAY[]::text[]),
  ('default','4','Americano','Taper Fade','Geral','https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&q=80&w=600',true,ARRAY[]::text[]),
  ('default','5','Degradê Navalhado','Razor Fade','Geral','https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=600',true,ARRAY[]::text[]),
  ('default','6','Militar','Buzz Cut','Geral','https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&q=80&w=600',true,ARRAY[]::text[]),
  ('default','7','Social','Clássico Tesoura','Geral','https://images.unsplash.com/photo-1517832606299-7ae9b720a186?auto=format&fit=crop&q=80&w=600',true,ARRAY[]::text[]),
  ('default','8','Black Power','Nudred / Sponge','Crespo / Cacheado','https://images.unsplash.com/photo-1514059074073-677a284e937d?auto=format&fit=crop&q=80&w=600',true,ARRAY[]::text[]),
  ('default','9','Flat Top','Topo Reto','Geral','https://images.unsplash.com/photo-1520338661084-680395057c93?auto=format&fit=crop&q=80&w=600',true,ARRAY[]::text[]),
  ('default','extra-c1','','','Geral','',false,ARRAY[]::text[]),
  ('default','extra-c2','','','Geral','',false,ARRAY[]::text[]),
  ('default','extra-c3','','','Geral','',false,ARRAY[]::text[]),
  ('default','extra-c4','','','Geral','',false,ARRAY[]::text[]),
  ('default','extra-c5','','','Geral','',false,ARRAY[]::text[]),
  ('default','extra-c6','','','Geral','',false,ARRAY[]::text[]),
  ('default','extra-c7','','','Geral','',false,ARRAY[]::text[]),
  ('default','extra-c8','','','Geral','',false,ARRAY[]::text[]),
  ('default','extra-c9','','','Geral','',false,ARRAY[]::text[]),
  ('default','extra-c10','','','Geral','',false,ARRAY[]::text[]),
  ('default','extra-c11','','','Geral','',false,ARRAY[]::text[]),
  ('default','extra-c12','','','Geral','',false,ARRAY[]::text[]),
  ('default','extra-c13','','','Geral','',false,ARRAY[]::text[]),
  ('default','extra-c14','','','Geral','',false,ARRAY[]::text[]),
  ('default','extra-c15','','','Geral','',false,ARRAY[]::text[]),
  ('default','extra-c16','','','Geral','',false,ARRAY[]::text[]),
  ('default','extra-c17','','','Geral','',false,ARRAY[]::text[]),
  ('default','extra-c18','','','Geral','',false,ARRAY[]::text[]),
  ('default','extra-c19','','','Geral','',false,ARRAY[]::text[]),
  ('default','extra-c20','','','Geral','',false,ARRAY[]::text[])
ON CONFLICT (site_key, id) DO UPDATE SET
  name = EXCLUDED.name,
  technical_name = EXCLUDED.technical_name,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url,
  active = EXCLUDED.active,
  options = EXCLUDED.options,
  updated_at = now();


INSERT INTO public.products (site_key, id, name, description, price, image_url, active, options, not_for_children)
VALUES
  ('default','prod-1','Pomada Matte','Alta fixação e efeito seco.',45,'https://images.unsplash.com/photo-1626895360980-d66a6a235338?auto=format&fit=crop&q=80&w=600',true,ARRAY[]::text[],false),
  ('default','prod-2','Óleo para Barba','Hidratação e perfume amadeirado.',35,'https://images.unsplash.com/photo-1626285861696-9f0bf5a49c6d?auto=format&fit=crop&q=80&w=600',true,ARRAY[]::text[],false),
  ('default','prod-3','Shampoo Mentolado','Limpeza profunda e refrescância.',30,'https://images.unsplash.com/photo-1608248597279-f99d160bfbc8?auto=format&fit=crop&q=80&w=600',true,ARRAY[]::text[],false),
  ('default','prod-4','','',0,'',false,ARRAY[]::text[],false),
  ('default','prod-5','','',0,'',false,ARRAY[]::text[],false),
  ('default','prod-6','','',0,'',false,ARRAY[]::text[],false),
  ('default','prod-7','','',0,'',false,ARRAY[]::text[],false),
  ('default','prod-8','','',0,'',false,ARRAY[]::text[],false),
  ('default','prod-9','','',0,'',false,ARRAY[]::text[],false),
  ('default','prod-10','','',0,'',false,ARRAY[]::text[],false),
  ('default','prod-11','','',0,'',false,ARRAY[]::text[],false),
  ('default','prod-12','','',0,'',false,ARRAY[]::text[],false),
  ('default','prod-13','','',0,'',false,ARRAY[]::text[],false),
  ('default','prod-14','','',0,'',false,ARRAY[]::text[],false),
  ('default','prod-15','','',0,'',false,ARRAY[]::text[],false)
ON CONFLICT (site_key, id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url,
  active = EXCLUDED.active,
  options = EXCLUDED.options,
  not_for_children = EXCLUDED.not_for_children,
  updated_at = now();


insert into public.testimonials (site_key, id, client_name, comment, rating, active)
values
  ('default', 't-1', 'Cliente', 'Atendimento impecável e corte perfeito.', 5, true)
on conflict (site_key, id) do update set
  client_name = excluded.client_name,
  comment = excluded.comment,
  rating = excluded.rating,
  active = excluded.active,
  updated_at = now();
