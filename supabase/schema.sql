-- ============================================================================
-- City Line Property — complete Supabase (Postgres) schema
-- ============================================================================
-- Run this whole file in: Supabase Dashboard -> SQL Editor -> New query -> Run.
-- It recreates everything from zero and seeds the 7 categories, the live
-- inventory, settings and the single admin account.
--
-- Runtime: the Next.js app talks to Supabase via the service-role key on the
-- server (never exposed to the browser). Public pages read published rows
-- through the API; the admin CRM writes through the same server-side client.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Reset (careful: this erases previous City Line tables)
-- ---------------------------------------------------------------------------
drop table if exists public.leads cascade;
drop table if exists public.properties cascade;
drop table if exists public.categories cascade;
drop table if exists public.admin_users cascade;
drop table if exists public.settings cascade;

-- ---------------------------------------------------------------------------
-- 1. Categories — the 7 property types we deal in
-- ---------------------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  icon        text not null default 'Building2',
  color       text not null default '#0F766E',
  description text not null default '',
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Properties — the inventory (prices always in PKR)
-- ---------------------------------------------------------------------------
create table public.properties (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  slug          text not null unique,
  reference     text not null unique,          -- CLP-101, CLP-102, ...
  description   text not null default '',
  price         double precision not null check (price >= 0),
  status        text not null check (status in ('SALE','RENT')),
  type          text not null references public.categories(slug),
  beds          int  not null default 0,
  baths         int  not null default 0,
  area          int  not null default 0,       -- sqft (plots: plot size)
  address       text not null default '',
  city          text not null default 'Lahore',
  district      text not null,                 -- one of the 5 areas
  images        jsonb not null default '[]',
  amenities     jsonb not null default '[]',
  featured      boolean not null default false,
  listing_state text not null default 'AVAILABLE' check (listing_state in ('AVAILABLE','RESERVED','SOLD','RENTED')),
  published     boolean not null default true, -- drafts are hidden from the site
  year_built    int  not null default 2024,
  parking       int  not null default 0,
  views         int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index properties_published_idx   on public.properties (published);
create index properties_status_idx      on public.properties (status) where published;
create index properties_type_idx        on public.properties (type)   where published;
create index properties_district_idx    on public.properties (district) where published;
create index properties_featured_idx    on public.properties (featured) where published;
create index properties_created_at_idx  on public.properties (created_at desc);

-- ---------------------------------------------------------------------------
-- 3. Leads — the CRM inbox (every website inquiry lands here)
-- ---------------------------------------------------------------------------
create table public.leads (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  phone             text not null,
  email             text,
  category          text,                        -- interested category slug
  area              text,                        -- interested area
  budget            bigint,                      -- PKR
  message           text not null,
  property_id       uuid references public.properties(id) on delete set null,
  source            text not null default 'WEBSITE' check (source in ('WEBSITE','CONTACT','PROPERTY','REQUIREMENT')),
  status            text not null default 'NEW' check (status in ('NEW','CONTACTED','SITE_VISIT','NEGOTIATION','WON','LOST')),
  notes             text,
  wa_status         text not null default 'PENDING' check (wa_status in ('PENDING','SENT','FAILED','SKIPPED')),
  wa_sent_at        timestamptz,
  wa_error          text,
  follow_up_at      timestamptz,
  last_contacted_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index leads_status_idx        on public.leads (status);
create index leads_created_at_idx    on public.leads (created_at desc);
create index leads_open_followup_idx on public.leads (follow_up_at) where status not in ('WON','LOST');

-- ---------------------------------------------------------------------------
-- 4. Admin users — single-admin scrypt login (same "salt:hash" format the
--    Next.js server verifies; matches src/lib/auth.ts)
-- ---------------------------------------------------------------------------
create table public.admin_users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  name          text not null default 'Administrator',
  password_hash text not null,
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 5. Settings — key/value (webhook_url, whatsapp_number, ...)
-- ---------------------------------------------------------------------------
create table public.settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 6. updated_at touch triggers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger properties_touch before update on public.properties for each row execute function public.touch_updated_at();
create trigger leads_touch       before update on public.leads       for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- 7. Row Level Security
--    The Next.js server uses the service_role key (bypasses RLS).
--    RLS keeps direct anon access safe by default.
-- ---------------------------------------------------------------------------
alter table public.categories  enable row level security;
alter table public.properties  enable row level security;
alter table public.leads       enable row level security;
alter table public.admin_users enable row level security;
alter table public.settings    enable row level security;

create policy "categories read" on public.categories for select using (true);

create policy "properties read published" on public.properties for select using (published = true);

create policy "leads insert" on public.leads for insert with check (
  char_length(name) between 2 and 80
  and char_length(message) between 5 and 2000
);

-- admin_users / settings: no anon policies, so only service_role can touch them.

-- ---------------------------------------------------------------------------
-- 8. Storage bucket for property photos (admin uploads)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('property-media', 'property-media', true)
on conflict (id) do nothing;

create policy "property media read" on storage.objects for select
  using (bucket_id = 'property-media');
create policy "property media write" on storage.objects for insert
  with check (bucket_id = 'property-media');
create policy "property media update" on storage.objects for update
  using (bucket_id = 'property-media');
create policy "property media delete" on storage.objects for delete
  using (bucket_id = 'property-media');

-- ---------------------------------------------------------------------------
-- 9. Seed — the 7 categories
-- ---------------------------------------------------------------------------
insert into public.categories (name, slug, icon, color, description, sort_order) values
;

-- ---------------------------------------------------------------------------
-- 10. Seed — the live inventory (mirrors prisma/seed-lahore.ts)
-- ---------------------------------------------------------------------------
insert into public.properties
  (title, slug, reference, description, price, status, type, beds, baths, area, address, city, district, images, amenities, featured, listing_state, published, year_built, parking, views)
values
  ('5 Marla Residential Plot — Block A, Near Main Boulevard', '5-marla-residential-plot-block-a-near-main-boulevard-1', 'CLP-101', 'Ideal 5 marla plot in the heart of Etihad Town Phase 1, a two-minute walk from the main boulevard. Level ground, demarcated, and ready for immediate possession. Only 1% commission — direct dealing with the office.', 8900000, 'SALE', 'residential-plots', 0, 0, 1361, 'Block A, near Main Boulevard', 'Lahore', 'Etihad Town Phase 1', '["/images/properties/plot-residential-1.png"]', '["Boundary wall", "Gated society", "Underground electricity", "Park facing"]', false, 'AVAILABLE', true, 2024, 0, 142),
  ('3 Marla Residential Plot — Block C, Quiet Street', '3-marla-residential-plot-block-c-quiet-street-2', 'CLP-102', 'Affordable 3 marla plot on a quiet 30-ft street in Phase 2. Perfect first investment or small-family home site. Transfer fees clear, no dues.', 5200000, 'SALE', 'residential-plots', 0, 0, 817, 'Block C, 30 ft street', 'Lahore', 'Etihad Town Phase 2', '["/images/properties/plot-residential-1.png"]', '["Boundary wall", "Gated society", "Underground electricity", "Park facing"]', false, 'AVAILABLE', true, 2024, 0, 89),
  ('10 Marla Residential Plot — Royal Enclave Block B', '10-marla-residential-plot-royal-enclave-block-b-3', 'CLP-103', 'Spacious 10 marla plot on a 40-ft boulevard in Royal Enclave. Corner-adjacent, park + mosque in walking distance. Genuine seller, market price.', 18500000, 'SALE', 'residential-plots', 0, 0, 2722, 'Block B, 40 ft boulevard', 'Lahore', 'Royal Enclave', '["/images/properties/plot-residential-1.png"]', '["Boundary wall", "Gated society", "Underground electricity", "Park facing"]', false, 'AVAILABLE', true, 2024, 0, 120),
  ('1 Kanal Corner Plot — Overseas Block', '1-kanal-corner-plot-overseas-block-4', 'CLP-104', 'Premium 1 kanal corner plot in the Overseas Block — double-road access, south-west open. The society''s most sought-after category for overseas buyers.', 41000000, 'SALE', 'residential-plots', 0, 0, 5445, 'Overseas Block, corner 60 ft road', 'Lahore', 'Overseas Block', '["/images/properties/plot-residential-1.png"]', '[]', true, 'AVAILABLE', true, 2024, 0, 231),
  ('4 Marla Commercial Plot — Main Boulevard', '4-marla-commercial-plot-main-boulevard-5', 'CLP-105', 'Rare 4 marla commercial plot directly on the Phase 1 main boulevard. Suit showroom, bank, or plaza. Highest footfall strip in the society.', 26000000, 'SALE', 'commercial-plots', 0, 0, 1089, 'Main Boulevard commercial strip', 'Lahore', 'Etihad Town Phase 1', '["/images/properties/plot-commercial-1.png"]', '[]', true, 'AVAILABLE', true, 2024, 0, 198),
  ('2.5 Marla Commercial Plot — Premier Enclave Commercial Zone', '2-5-marla-commercial-plot-premier-enclave-commercial-zone-6', 'CLP-106', 'Compact commercial plot in Premier Enclave''s designated market zone. Ideal for a clinic, mini-mart or franchise outlet.', 14500000, 'SALE', 'commercial-plots', 0, 0, 681, 'Commercial Zone, 50 ft road', 'Lahore', 'Premier Enclave', '["/images/properties/plot-commercial-1.png"]', '[]', false, 'AVAILABLE', true, 2024, 0, 76),
  ('5 Marla Brand-New House — Modern Open Design', '5-marla-brand-new-house-modern-open-design-7', 'CLP-107', 'Brand-new 5 marla house, never lived in. Open-plan lounge, modular kitchen, four attached bedrooms, roof terrace with city view. Move-in ready.', 21500000, 'SALE', 'houses', 4, 4, 2100, 'Block D, 30 ft street', 'Lahore', 'Etihad Town Phase 1', '["/images/properties/house-1.jpg", "/images/properties/kitchen-1.jpg", "/images/properties/bedroom-1.jpg"]', '["Attached bath", "Drawing room", "Servant quarter", "Roof terrace", "Car porch"]', true, 'AVAILABLE', true, 2024, 1, 305),
  ('10 Marla Designer House — 4 Beds with Lawn', '10-marla-designer-house-4-beds-with-lawn-8', 'CLP-108', 'Designer 10 marla residence in Royal Enclave — double-height entrance, imported fittings, two car porches and a landscaped lawn.', 38500000, 'SALE', 'houses', 5, 6, 4200, 'Block A, 40 ft boulevard', 'Lahore', 'Royal Enclave', '["/images/properties/villa-1.jpg", "/images/properties/villa-2.jpg", "/images/properties/bedroom-1.jpg"]', '[]', false, 'AVAILABLE', true, 2022, 2, 174),
  ('3 Marla House — Ideal Small Family Home', '3-marla-house-ideal-small-family-home-9', 'CLP-109', 'Neat 3 marla house in Premier Enclave — three bedrooms, draw-dining, and a quiet street. A genuine bargain at market rate.', 13500000, 'SALE', 'houses', 3, 3, 1250, 'Block C, 25 ft street', 'Lahore', 'Premier Enclave', '["/images/properties/townhouse-1.jpg", "/images/properties/kitchen-1.jpg"]', '["Attached bath", "Drawing room", "Servant quarter", "Roof terrace", "Car porch"]', false, 'AVAILABLE', true, 2021, 1, 98),
  ('3-Bed Luxury Apartment — Park Facing', '3-bed-luxury-apartment-park-facing-10', 'CLP-110', 'Park-facing 3-bed apartment with lift, backup power and 24/7 security. Located on Central Avenue, minutes from the Phase 2 gate.', 10800000, 'SALE', 'apartments', 3, 3, 1650, 'Central Avenue, 3rd floor', 'Lahore', 'Etihad Town Phase 2', '["/images/properties/apartment-ext-1.png", "/images/properties/apartment-1.jpg", "/images/properties/apartment-2.jpg"]', '["Lift", "Security", "Backup power", "Parking", "Prayer area"]', true, 'AVAILABLE', true, 2023, 1, 262),
  ('2-Bed Apartment — Bank Allocated', '2-bed-apartment-bank-allocated-11', 'CLP-111', 'Well-built 2-bed unit in the Overseas Block — bank allocated, clean file, strong rental demand from the nearby commercial district.', 8500000, 'SALE', 'apartments', 2, 2, 1100, 'Block B, 2nd floor', 'Lahore', 'Overseas Block', '["/images/properties/apartment-2.jpg", "/images/properties/apartment-1.jpg"]', '["Lift", "Security", "Backup power", "Parking", "Prayer area"]', false, 'AVAILABLE', true, 2022, 1, 133),
  ('Studio Flat — Furnished, High Rental Yield', 'studio-flat-furnished-high-rental-yield-12', 'CLP-112', 'Fully furnished studio on the main boulevard — the easiest entry into Etihad Town property. Tenants currently paying PKR 38,000/month.', 5800000, 'SALE', 'flat-studio', 1, 1, 620, 'Main Boulevard, 4th floor', 'Lahore', 'Etihad Town Phase 1', '["/images/properties/loft-1.jpg", "/images/properties/bedroom-1.jpg"]', '[]', false, 'AVAILABLE', true, 2023, 0, 187),
  ('Commercial Hall — 8,000 sqft on Main Boulevard', 'commercial-hall-8-000-sqft-on-main-boulevard-13', 'CLP-113', 'Purpose-built 8,000 sqft commercial hall on the Phase 2 main boulevard — loading dock, mezzanine office cabin, ten-car parking. Ideal for distribution or a franchise.', 68000000, 'SALE', 'commercial-halls', 0, 3, 8000, 'Main Boulevard commercial strip', 'Lahore', 'Etihad Town Phase 2', '["/images/properties/commercial-hall-1.png", "/images/properties/office-1.jpg"]', '["Loading dock", "Office cabin", "Washrooms", "3-phase power", "Fire exit"]', true, 'AVAILABLE', true, 2021, 10, 149),
  ('5 Marla House on Rent — Family Home', '5-marla-house-on-rent-family-home-14', 'CLP-114', 'Well-maintained 5 marla family house available immediately. Three bedrooms, draw-dining, car porch. Two advances, one month commission (1%).', 95000, 'RENT', 'for-rent', 3, 3, 1800, 'Block D, 30 ft street', 'Lahore', 'Etihad Town Phase 1', '["/images/properties/house-1.jpg", "/images/properties/bedroom-1.jpg"]', '["Attached bath", "Drawing room", "Servant quarter", "Roof terrace", "Car porch"]', false, 'AVAILABLE', true, 2020, 1, 121),
  ('3-Bed Apartment on Rent — Semi-Furnished', '3-bed-apartment-on-rent-semi-furnished-15', 'CLP-115', 'Semi-furnished 3-bed apartment with lift and backup. Family or bachelors (executives) welcome. Walking distance from the commercial strip.', 78000, 'RENT', 'for-rent', 3, 3, 1650, 'Central Avenue, 5th floor', 'Lahore', 'Overseas Block', '["/images/properties/apartment-1.jpg", "/images/properties/apartment-ext-1.png"]', '["Lift", "Security", "Backup power", "Parking", "Prayer area"]', false, 'AVAILABLE', true, 2023, 1, 96),
  ('Commercial Hall on Rent — Main Road Phase 1', 'commercial-hall-on-rent-main-road-phase-1-16', 'CLP-116', '5,200 sqft hall on the Phase 1 main road — suits a brand outlet, gym or software house. Power 15 kW, dedicated parking.', 285000, 'RENT', 'for-rent', 0, 2, 5200, 'Main Road commercial strip', 'Lahore', 'Etihad Town Phase 1', '["/images/properties/commercial-hall-1.png", "/images/properties/office-1.jpg"]', '["Loading dock", "Office cabin", "Washrooms", "3-phase power", "Fire exit"]', false, 'AVAILABLE', true, 2020, 6, 88);

-- ---------------------------------------------------------------------------
-- 11. Seed — settings + single admin
--     Admin login: admin@citylineproperty.com / CityLine@2025  (CHANGE IT from
--     the admin panel after first sign-in.)
-- ---------------------------------------------------------------------------
insert into public.settings (key, value) values
  ('whatsapp_number',   '923094499940'),
  ('whatsapp_number_2', '923218422109'),
  ('office_address',    '151-C, Etihad Town Phase 1, Lahore'),
  ('business_email',    'citylineproperty1@gmail.com'),
  ('office_hours',      'Mon-Sat . 9:00 AM - 7:00 PM'),
  ('webhook_url',       '');

insert into public.admin_users (email, name, password_hash) values
  ('admin@citylineproperty.com', 'City Line Admin', '0123456789abcdef0123456789abcdef:5e10b78b7e9cda96ad06c9ff60a69d24174abea720ea9830a2c1b387f8a1795850b2e521e76d3d76589f4f25af80d217be2077fb2eb96e41cb5233f9592d4f8a');

-- ---------------------------------------------------------------------------
-- 12. Done — verify with:
--     select count(*) from public.properties;   -- 8
--     select count(*) from public.categories;   -- 7
-- ---------------------------------------------------------------------------
