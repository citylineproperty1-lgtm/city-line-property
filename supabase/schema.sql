-- ============================================================================
-- CITY LINE PROPERTY — COMPLETE SUPABASE / POSTGRES SCHEMA
-- "Your Key to the City" — Etihad Town, Lahore
--
-- HOW TO RUN
--   1. Open your Supabase dashboard → SQL Editor → New query.
--   2. Paste this whole file and Run. It is designed for a fresh project
--      (drops + recreates all City Line objects).
--   3. Storage: the property-images bucket is created below automatically.
--
-- WHAT'S INSIDE
--   • Enums + tables (admin_users, categories, agents, properties, leads,
--     testimonials, newsletter_subscribers, view_events, digest_posts, settings)
--   • Indexes, updated_at triggers, view counter trigger
--   • Row Level Security: public can read published listings & insert leads;
--     everything else is service_role only
--   • Storage bucket + policies for listing photos
--   • Full seed: 7 categories, 3 team members, 16 Lahore listings (5 areas),
--     testimonials, settings, admin account
--   • Optional Edge Function sketch for auto-sending leads to WhatsApp
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. RESET (fresh install only)
-- ---------------------------------------------------------------------------
drop table if exists public.view_events cascade;
drop table if exists public.leads cascade;
drop table if exists public.properties cascade;
drop table if exists public.categories cascade;
drop table if exists public.agents cascade;
drop table if exists public.testimonials cascade;
drop table if exists public.newsletter_subscribers cascade;
drop table if exists public.admin_users cascade;
drop table if exists public.settings cascade;

-- ---------------------------------------------------------------------------
-- 1. EXTENSIONS + ENUMS
-- ---------------------------------------------------------------------------
create extension if not exists "pgcrypto";

create type public.property_status as enum ('SALE', 'RENT');
create type public.listing_state   as enum ('AVAILABLE', 'RESERVED', 'SOLD', 'RENTED');
create type public.lead_status     as enum ('NEW', 'CONTACTED', 'SITE_VISIT', 'NEGOTIATION', 'WON', 'LOST');
create type public.lead_source     as enum ('WEBSITE', 'CONTACT', 'PROPERTY', 'REQUIREMENT', 'WHATSAPP');
create type public.wa_status       as enum ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- ---------------------------------------------------------------------------
-- 2. TABLES
-- ---------------------------------------------------------------------------

-- Single-admin CRM login (scrypt hash "salt:hash", same format as the app)
create table public.admin_users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  name          text not null default 'Administrator',
  password_hash text not null,
  created_at    timestamptz not null default now()
);

-- Admin-managed property categories (icon = lucide icon name)
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  icon        text not null default 'Building2',
  color       text not null default '#C9A227',
  description text not null default '',
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now()
);

-- Team members shown on the site (listings reference them)
create table public.agents (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  title      text not null,
  email      text not null unique,
  phone      text not null,
  initials   text not null,
  accent     text not null default '#C9A227',
  bio        text not null default '',
  created_at timestamptz not null default now()
);

-- Inventory
create table public.properties (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  slug          text not null unique,
  reference     text not null unique,              -- CLP-101 …
  description   text not null default '',
  price         numeric(14,2) not null check (price > 0),   -- PKR (per month when RENT)
  status        public.property_status not null,
  type          text not null references public.categories(slug),
  beds          int  not null default 0,
  baths         int  not null default 0,
  area          int  not null default 0,           -- sqft
  address       text not null default '',
  city          text not null default 'Lahore',
  district      text not null,                     -- one of the 5 areas
  images        jsonb not null default '[]'::jsonb,
  amenities     jsonb not null default '[]'::jsonb,
  featured      boolean not null default false,
  listing_state public.listing_state not null default 'AVAILABLE',
  published     boolean not null default true,
  year_built    int,
  parking       int  not null default 0,
  views         int  not null default 0,
  rating        numeric(2,1) not null default 4.6,
  agent_id      uuid not null references public.agents(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- CRM leads captured from the website (requirement form / contact / listing)
create table public.leads (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  phone       text not null,
  email       text,
  category    text,
  area        text,
  budget      numeric(14,2),
  message     text not null,
  property_id uuid references public.properties(id) on delete set null,
  source      public.lead_source not null default 'WEBSITE',
  status      public.lead_status not null default 'NEW',
  notes       text,
  wa_status   public.wa_status not null default 'PENDING',
  wa_sent_at  timestamptz,
  wa_error    text,
  -- Follow-up reminders (CRM): when to call next, and when we last reached them
  follow_up_at      timestamptz,
  last_contacted_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Reminder-driven views: overdue + today's due follow-ups first (open leads only)
create index if not exists leads_follow_up_due_idx
  on public.leads (follow_up_at)
  where follow_up_at is not null and status not in ('WON', 'LOST');

create table public.testimonials (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text not null,
  content    text not null,
  rating     int  not null default 5 check (rating between 1 and 5),
  initials   text not null
);

create table public.newsletter_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  created_at timestamptz not null default now()
);

-- One row per detail view — powers the insights traffic chart
create table public.view_events (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  created_at  timestamptz not null default now()
);

-- Property Digest editorial posts (market notes, guides, area updates)
create table public.digest_posts (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,
  excerpt     text not null default '',
  content     text not null default '',
  cover       text,
  tag         text not null default 'Market notes',
  author      text not null default 'City Line Property',
  published   boolean not null default true,
  views       int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint digest_posts_excerpt_len check (char_length(excerpt) <= 400)
);

-- Key/value settings (webhook_url, whatsapp numbers, office info…)
create table public.settings (
  key        text primary key,
  value      text not null default '',
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 3. INDEXES
-- ---------------------------------------------------------------------------
create index properties_published_idx   on public.properties (published);
create index properties_status_idx      on public.properties (status);
create index properties_type_idx        on public.properties (type);
create index properties_district_idx    on public.properties (district);
create index properties_featured_idx    on public.properties (featured);
create index properties_price_idx       on public.properties (price);
create index properties_created_idx     on public.properties (created_at desc);
create index leads_status_idx           on public.leads (status);
create index leads_created_idx          on public.leads (created_at desc);
create index view_events_property_idx   on public.view_events (property_id, created_at desc);
create index digest_posts_published_idx on public.digest_posts (published, created_at desc);
create index digest_posts_tag_idx       on public.digest_posts (tag);

-- ---------------------------------------------------------------------------
-- 4. TRIGGERS (updated_at + view counter)
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger properties_updated_at before update on public.properties
  for each row execute function public.set_updated_at();
create trigger leads_updated_at before update on public.leads
  for each row execute function public.set_updated_at();
create trigger settings_updated_at before update on public.settings
  for each row execute function public.set_updated_at();
create trigger digest_posts_updated_at before update on public.digest_posts
  for each row execute function public.set_updated_at();

-- Auto-increment the listing view counter whenever a view event lands
create or replace function public.bump_property_views()
returns trigger language plpgsql security definer as $$
begin
  update public.properties
     set views = views + 1
   where id = new.property_id;
  return new;
end $$;

create trigger view_events_bump after insert on public.view_events
  for each row execute function public.bump_property_views();

-- ---------------------------------------------------------------------------
-- 5. ROW LEVEL SECURITY
--    Public site = anon key.  Admin/CRM operations = service_role (bypasses RLS)
--    and must only ever run from a trusted backend.
-- ---------------------------------------------------------------------------
alter table public.admin_users            enable row level security;
alter table public.categories             enable row level security;
alter table public.agents                 enable row level security;
alter table public.properties             enable row level security;
alter table public.leads                  enable row level security;
alter table public.testimonials           enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.view_events            enable row level security;
alter table public.digest_posts           enable row level security;
alter table public.settings               enable row level security;

-- Public catalog: published listings only
create policy "public reads published properties"
  on public.properties for select to anon
  using (published = true);

create policy "public reads categories"  on public.categories for select to anon using (true);
create policy "public reads agents"      on public.agents     for select to anon using (true);
create policy "public reads testimonials" on public.testimonials for select to anon using (true);
create policy "public reads published digest posts"
  on public.digest_posts for select to anon
  using (published = true);

-- Anyone can submit a lead or subscribe
create policy "public inserts leads" on public.leads for insert to anon with check (true);
create policy "public inserts subscribers" on public.newsletter_subscribers for insert to anon with check (true);

-- admin_users, settings, view_events, digest_posts (writes): NO anon policies
-- → service_role only.
-- (Leads SELECT/UPDATE/DELETE also service_role only — the CRM inbox is private.)

-- ---------------------------------------------------------------------------
-- 6. STORAGE — listing photos
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('property-images', 'property-images', true)
on conflict (id) do nothing;

create policy "public reads property images"
  on storage.objects for select to anon
  using (bucket_id = 'property-images');

-- Uploads happen with the service key from your backend:
--   supabase.storage.from('property-images').upload(`<path>`, file)
create policy "service writes property images"
  on storage.objects for insert to service_role
  with check (bucket_id = 'property-images');

-- ---------------------------------------------------------------------------
-- 7. SEED — categories (the only 7 we deal in)
-- ---------------------------------------------------------------------------
insert into public.categories (name, slug, icon, color, description, sort_order) values
  ('Residential Plots', 'residential-plots', 'LandPlot',  '#34C759', '3 Marla to 1 Kanal residential plots in every block', 1),
  ('Commercial Plots',  'commercial-plots',  'Store',     '#FF9500', 'Main-boulevard commercial plots with high footfall',  2),
  ('Houses',            'houses',            'Home',      '#A2845E', 'Brand-new and pre-owned houses, ready to move',       3),
  ('Apartments',        'apartments',        'Building2', '#30B0C7', 'Modern apartments with premium amenities',            4),
  ('Commercial Halls',  'commercial-halls',  'Warehouse', '#AF52DE', 'Halls and warehouses for business & investment',      5),
  ('Flat / Studio',     'flat-studio',       'BedDouble', '#FF2D55', 'Compact flats and studios, ideal first investment',   6),
  ('For Rent',          'for-rent',          'KeyRound',  '#007AFF', 'Houses, apartments and halls available on rent',      7);

-- ---------------------------------------------------------------------------
-- 8. SEED — team
-- ---------------------------------------------------------------------------
insert into public.agents (name, title, email, phone, initials, accent, bio) values
  ('Hamza Tariq',  'Founder & Principal Agent',      'hamza@citylineproperty1@gmail.com',  '0309 4499940', 'HT', '#C9A227',
   'Founded City Line Property to bring transparent, fixed-1% commission dealing to Etihad Town. Lives in Phase 1 and personally walks every plot he sells.'),
  ('Bilal Ahmed',  'Senior Property Consultant',     'bilal@citylineproperty1@gmail.com',  '0321 8422109', 'BA', '#30B0C7',
   'Eight years of Lahore housing-society experience. Specialises in residential plots and houses across Etihad Town, Royal Enclave and Premier Enclave.'),
  ('Ayesha Malik', 'Rentals & Investments Specialist','ayesha@citylineproperty1@gmail.com', '0321 8422109', 'AM', '#AF52DE',
   'Helps overseas Pakistanis and first-time buyers pick high-yield flats and studios — direct dealing, no middlemen, paperwork handled end to end.');

-- ---------------------------------------------------------------------------
-- 9. SEED — 16 listings across the 5 areas
-- ---------------------------------------------------------------------------
insert into public.properties
  (reference, slug, title, description, price, status, type, beds, baths, area, address, city, district, images, amenities, featured, year_built, parking, views, rating, agent_id)
values
  ('CLP-101','5-marla-residential-plot-block-a-near-main-boulevard-1',
   '5 Marla Residential Plot — Block A, Near Main Boulevard',
   'Ideal 5 marla plot in the heart of Etihad Town Phase 1, a two-minute walk from the main boulevard. Level ground, demarcated, and ready for immediate possession. Only 1% commission — direct dealing with the office.',
   8900000,'SALE','residential-plots',0,0,1361,'Block A, near Main Boulevard','Lahore','Etihad Town Phase 1',
   '["/images/properties/plot-residential-1.png"]','["Boundary wall","Gated society","Underground electricity","Park facing"]',false,2024,0,142,4.6,
   (select id from public.agents where email='hamza@citylineproperty1@gmail.com')),

  ('CLP-102','3-marla-residential-plot-block-c-quiet-street-2',
   '3 Marla Residential Plot — Block C, Quiet Street',
   'Affordable 3 marla plot on a quiet 30-ft street in Phase 2. Perfect first investment or small-family home site. Transfer fees clear, no dues.',
   5200000,'SALE','residential-plots',0,0,817,'Block C, 30 ft street','Lahore','Etihad Town Phase 2',
   '["/images/properties/plot-residential-1.png"]','["Boundary wall","Gated society","Underground electricity","Park facing"]',false,2024,0,89,4.6,
   (select id from public.agents where email='bilal@citylineproperty1@gmail.com')),

  ('CLP-103','10-marla-residential-plot-royal-enclave-block-b-3',
   '10 Marla Residential Plot — Royal Enclave Block B',
   'Spacious 10 marla plot on a 40-ft boulevard in Royal Enclave. Corner-adjacent, park + mosque in walking distance. Genuine seller, market price.',
   18500000,'SALE','residential-plots',0,0,2722,'Block B, 40 ft boulevard','Lahore','Royal Enclave',
   '["/images/properties/plot-residential-1.png"]','["Boundary wall","Gated society","Underground electricity","Park facing"]',false,2024,0,120,4.6,
   (select id from public.agents where email='hamza@citylineproperty1@gmail.com')),

  ('CLP-104','1-kanal-corner-plot-overseas-block-4',
   '1 Kanal Corner Plot — Overseas Block',
   'Premium 1 kanal corner plot in the Overseas Block — double-road access, south-west open. The society''s most sought-after category for overseas buyers.',
   41000000,'SALE','residential-plots',0,0,5445,'Overseas Block, corner 60 ft road','Lahore','Overseas Block',
   '["/images/properties/plot-residential-1.png"]','["Corner plot","Boundary wall","Gated society","Underground electricity"]',true,2024,0,231,4.8,
   (select id from public.agents where email='hamza@citylineproperty1@gmail.com')),

  ('CLP-105','4-marla-commercial-plot-main-boulevard-5',
   '4 Marla Commercial Plot — Main Boulevard',
   'Rare 4 marla commercial plot directly on the Phase 1 main boulevard. Suit showroom, bank, or plaza. Highest footfall strip in the society.',
   26000000,'SALE','commercial-plots',0,0,1089,'Main Boulevard commercial strip','Lahore','Etihad Town Phase 1',
   '["/images/properties/plot-commercial-1.png"]','["Main boulevard","High footfall","Commercial zoning"]',true,2024,0,198,4.7,
   (select id from public.agents where email='hamza@citylineproperty1@gmail.com')),

  ('CLP-106','2-5-marla-commercial-plot-premier-enclave-commercial-zone-6',
   '2.5 Marla Commercial Plot — Premier Enclave Commercial Zone',
   'Compact commercial plot in Premier Enclave''s designated market zone. Ideal for a clinic, mini-mart or franchise outlet.',
   14500000,'SALE','commercial-plots',0,0,681,'Commercial Zone, 50 ft road','Lahore','Premier Enclave',
   '["/images/properties/plot-commercial-1.png"]','["Commercial zoning","Wide road","Gated society"]',false,2024,0,76,4.5,
   (select id from public.agents where email='bilal@citylineproperty1@gmail.com')),

  ('CLP-107','5-marla-brand-new-house-modern-open-design-7',
   '5 Marla Brand-New House — Modern Open Design',
   'Brand-new 5 marla house, never lived in. Open-plan lounge, modular kitchen, four attached bedrooms, roof terrace with city view. Move-in ready.',
   21500000,'SALE','houses',4,4,2100,'Block D, 30 ft street','Lahore','Etihad Town Phase 1',
   '["/images/properties/house-1.jpg","/images/properties/kitchen-1.jpg","/images/properties/bedroom-1.jpg"]','["Attached bath","Drawing room","Servant quarter","Roof terrace","Car porch"]',true,2024,1,305,4.9,
   (select id from public.agents where email='hamza@citylineproperty1@gmail.com')),

  ('CLP-108','10-marla-designer-house-4-beds-with-lawn-8',
   '10 Marla Designer House — 4 Beds with Lawn',
   'Designer 10 marla residence in Royal Enclave — double-height entrance, imported fittings, two car porches and a landscaped lawn.',
   38500000,'SALE','houses',5,6,4200,'Block A, 40 ft boulevard','Lahore','Royal Enclave',
   '["/images/properties/villa-1.jpg","/images/properties/villa-2.jpg","/images/properties/bedroom-1.jpg"]','["Attached bath","Drawing room","Servant quarter","Roof terrace","Car porch","Lawn","Study room"]',false,2022,2,174,4.7,
   (select id from public.agents where email='bilal@citylineproperty1@gmail.com')),

  ('CLP-109','3-marla-house-ideal-small-family-home-9',
   '3 Marla House — Ideal Small Family Home',
   'Neat 3 marla house in Premier Enclave — three bedrooms, draw-dining, and a quiet street. A genuine bargain at market rate.',
   13500000,'SALE','houses',3,3,1250,'Block C, 25 ft street','Lahore','Premier Enclave',
   '["/images/properties/townhouse-1.jpg","/images/properties/kitchen-1.jpg"]','["Attached bath","Drawing room","Servant quarter","Roof terrace","Car porch"]',false,2021,1,98,4.5,
   (select id from public.agents where email='ayesha@citylineproperty1@gmail.com')),

  ('CLP-110','3-bed-luxury-apartment-park-facing-10',
   '3-Bed Luxury Apartment — Park Facing',
   'Park-facing 3-bed apartment with lift, backup power and 24/7 security. Located on Central Avenue, minutes from the Phase 2 gate.',
   10800000,'SALE','apartments',3,3,1650,'Central Avenue, 3rd floor','Lahore','Etihad Town Phase 2',
   '["/images/properties/apartment-ext-1.png","/images/properties/apartment-1.jpg","/images/properties/apartment-2.jpg"]','["Lift","Security","Backup power","Parking","Prayer area"]',true,2023,1,262,4.8,
   (select id from public.agents where email='ayesha@citylineproperty1@gmail.com')),

  ('CLP-111','2-bed-apartment-bank-allocated-11',
   '2-Bed Apartment — Bank Allocated',
   'Well-built 2-bed unit in the Overseas Block — bank allocated, clean file, strong rental demand from the nearby commercial district.',
   8500000,'SALE','apartments',2,2,1100,'Block B, 2nd floor','Lahore','Overseas Block',
   '["/images/properties/apartment-2.jpg","/images/properties/apartment-1.jpg"]','["Lift","Security","Backup power","Parking","Prayer area"]',false,2022,1,133,4.5,
   (select id from public.agents where email='ayesha@citylineproperty1@gmail.com')),

  ('CLP-112','studio-flat-furnished-high-rental-yield-12',
   'Studio Flat — Furnished, High Rental Yield',
   'Fully furnished studio on the main boulevard — the easiest entry into Etihad Town property. Tenants currently paying PKR 38,000/month.',
   5800000,'SALE','flat-studio',1,1,620,'Main Boulevard, 4th floor','Lahore','Etihad Town Phase 1',
   '["/images/properties/loft-1.jpg","/images/properties/bedroom-1.jpg"]','["Lift","Security","Backup power","Parking","Prayer area","Furnished"]',false,2023,0,187,4.6,
   (select id from public.agents where email='ayesha@citylineproperty1@gmail.com')),

  ('CLP-113','commercial-hall-8000-sqft-on-main-boulevard-13',
   'Commercial Hall — 8,000 sqft on Main Boulevard',
   'Purpose-built 8,000 sqft commercial hall on the Phase 2 main boulevard — loading dock, mezzanine office cabin, ten-car parking. Ideal for distribution or a franchise.',
   68000000,'SALE','commercial-halls',0,3,8000,'Main Boulevard commercial strip','Lahore','Etihad Town Phase 2',
   '["/images/properties/commercial-hall-1.png","/images/properties/office-1.jpg"]','["Loading dock","Office cabin","Washrooms","3-phase power","Fire exit"]',true,2021,10,149,4.7,
   (select id from public.agents where email='hamza@citylineproperty1@gmail.com')),

  ('CLP-114','5-marla-house-on-rent-family-home-14',
   '5 Marla House on Rent — Family Home',
   'Well-maintained 5 marla family house available immediately. Three bedrooms, draw-dining, car porch. Two advances, one month commission (1%).',
   95000,'RENT','for-rent',3,3,1800,'Block D, 30 ft street','Lahore','Etihad Town Phase 1',
   '["/images/properties/house-1.jpg","/images/properties/bedroom-1.jpg"]','["Attached bath","Drawing room","Servant quarter","Roof terrace","Car porch"]',false,2020,1,121,4.5,
   (select id from public.agents where email='ayesha@citylineproperty1@gmail.com')),

  ('CLP-115','3-bed-apartment-on-rent-semi-furnished-15',
   '3-Bed Apartment on Rent — Semi-Furnished',
   'Semi-furnished 3-bed apartment with lift and backup. Family or executives welcome. Walking distance from the commercial strip.',
   78000,'RENT','for-rent',3,3,1650,'Central Avenue, 5th floor','Lahore','Overseas Block',
   '["/images/properties/apartment-1.jpg","/images/properties/apartment-ext-1.png"]','["Lift","Security","Backup power","Parking","Prayer area"]',false,2023,1,96,4.6,
   (select id from public.agents where email='ayesha@citylineproperty1@gmail.com')),

  ('CLP-116','commercial-hall-on-rent-main-road-phase-1-16',
   'Commercial Hall on Rent — Main Road Phase 1',
   '5,200 sqft hall on the Phase 1 main road — suits a brand outlet, gym or software house. Power 15 kW, dedicated parking.',
   285000,'RENT','for-rent',0,2,5200,'Main Road commercial strip','Lahore','Etihad Town Phase 1',
   '["/images/properties/commercial-hall-1.png","/images/properties/office-1.jpg"]','["Loading dock","Office cabin","Washrooms","3-phase power","Fire exit"]',false,2020,6,88,4.5,
   (select id from public.agents where email='bilal@citylineproperty1@gmail.com'));

-- ---------------------------------------------------------------------------
-- 10. SEED — testimonials, settings, admin, sample leads
-- ---------------------------------------------------------------------------
insert into public.testimonials (name, role, content, rating, initials) values
  ('Kashif Mehmood','Bought 5 Marla plot · Phase 1','Paid exactly 1% — no surprise ''charges'' like other dealers. Hamza sahib showed me seven plots in one evening and the transfer was done in ten days.',5,'KM'),
  ('Dr. Sadia Anwar','Bought apartment · Phase 2','The team handled file verification, transfer and even handover keys. Direct dealing really means direct here — I always spoke to the owner himself.',5,'SA'),
  ('Tanveer Ahmed','Rented commercial hall · Main Road','Found my warehouse on the main road within a week. Honest negotiation and the commission was exactly what was promised: one percent.',5,'TA'),
  ('Rukhsana Bibi','Sold 10 Marla house · Royal Enclave','Got three genuine buyers in a fortnight. Everything written on paper, nothing hidden. Highly recommended for Royal Enclave property.',4,'RB');

insert into public.settings (key, value) values
  ('whatsapp_number',    '923094499940'),
  ('whatsapp_number_2',  '923218422109'),
  ('office_address',     '151-C, Etihad Town Phase 1, Lahore'),
  ('business_email',     'citylineproperty1@gmail.com'),
  ('office_hours',       'Mon–Sat · 9:00 AM – 7:00 PM'),
  ('webhook_url',        '');

-- Admin login: admin@citylineproperty.com / CityLine@2025
-- (scrypt "salt:hash" — same verification as the Next.js app)
insert into public.admin_users (email, name, password_hash) values
  ('admin@citylineproperty.com', 'City Line Admin',
   '892b11c6ab9e2841e36fc4053d16d57f:16f14116528bccecabbb17453c4afc688ee8e0368470ba7fbc1453dd75d683ad92bd39db54bfa9c57f50f5820650f8a2646ed9242dd4272be669444a3eba0b55');

insert into public.leads (name, phone, email, category, area, budget, message, property_id, source, status, wa_status) values
  ('Ahmed Raza','0300 1234567','ahmed.raza@example.com','residential-plots','Etihad Town Phase 1',9000000,
   'Looking for a 5 marla plot in Phase 1, cash purchase, need possession-ready. Please share options.', null,'REQUIREMENT','NEW','SKIPPED'),
  ('Sana Khalid','0321 5550182',null,'apartments','Etihad Town Phase 2',11000000,
   'Need a 3-bed apartment, park facing preferred. Can visit this weekend.', null,'WEBSITE','CONTACTED','SKIPPED'),
  ('Usman Ghani','0333 7700211',null,null,null,null,
   'Interested in the 8000 sqft hall. Is the mezzanine included in the quoted price?',
   (select id from public.properties where reference='CLP-113'),'PROPERTY','NEGOTIATION','SKIPPED');

-- A few view events so the insights chart has history
insert into public.view_events (property_id, created_at)
select p.id, now() - (random() * interval '13 days')
from public.properties p, generate_series(1, 9) g;

-- Launch articles for the Property Digest (public: #/digest)
insert into public.digest_posts (title, slug, excerpt, content, cover, tag, created_at) values
  ('Why Etihad Town Phase 1 is Lahore''s smartest buy right now',
   'why-etihad-town-phase-1-smartest-buy',
   'Ring Road access, finished infrastructure and prices still below DHA — Phase 1 has quietly become the best value per marla on Lahore''s west side.',
   'Every month we walk dozens of plots in Etihad Town Phase 1 with buyers from Lahore and overseas, and the same question comes up: why here?

## The numbers

Average asking prices in Phase 1 sit roughly 35–45% below comparable DHA phases, while Ring Road puts Mall Road within an easy drive. Same finished-society feel, materially lower entry.

Come by the office at 151-C, Etihad Town Phase 1 — the chai is on us.',
   '/images/properties/plot-residential-1.png',
   'Market notes',
   now() - interval '2 days'),
  ('1% commission, explained: what direct dealing actually saves you',
   'one-percent-commission-explained',
   'The traditional Lahore broker chain quietly adds 2–4% to every deal. Here is the arithmetic of why we charge 1% — and what it saves on a 2 crore plot.',
   'Most property deals in Lahore pass through three or four hands. Each adds their margin, and nobody writes it on a receipt.

## The arithmetic

On a PKR 2 crore plot: a traditional chain adds PKR 400,000–800,000 in hidden margins. City Line Property charges PKR 200,000 — flat, in writing, nothing else.',
   null,
   'Guides',
   now() - interval '1 day'),
  ('Plot vs house vs apartment: where should your first 1.5 crore go?',
   'plot-vs-house-vs-apartment-first-crore',
   'Three buyers, three budgets, three very different outcomes. A practical walkthrough of capital growth, rental yield and holding cost in Etihad Town''s five blocks.',
   'A family walks into our office with PKR 1.5 crore and one question: where does this work hardest?

## Our rule of thumb

Buying to hold 3+ years with no income needed? Plot. Need a home within a year? House. Want monthly cash flow? Apartment or studio.',
   '/images/properties/plot-commercial-1.png',
   'Guides',
   now());

-- ============================================================================
-- 11. OPTIONAL — auto-forward new leads to WhatsApp via a Database Webhook
--
--     Supabase → Database → Webhooks → create a webhook on table `leads`,
--     event INSERT, pointing at either:
--
--     a) A CallMeBot URL (no official API — message lands in your WhatsApp):
--        https://api.callmebot.com/whatsapp.php?phone=923094499940&text={MESSAGE}&apikey=YOUR_KEY
--        (register once by messaging "I allow callmebot to send me messages"
--         to +34 644 51 95 23 from your WhatsApp to receive YOUR apikey)
--
--     b) An Edge Function (full control, recommended):
--
--     // supabase/functions/lead-whatsapp/index.ts
--     import { serve } from "https://deno.land/std/http/server.ts";
--     serve(async (req) => {
--       const { record } = await req.json();            // new lead row
--       const text = encodeURIComponent(
--         `🏠 New Property Lead\n👤 ${record.name}\n📞 ${record.phone}\n` +
--         `💬 ${record.message}`
--       );
--       const key = Deno.env.get("CALLMEBOT_APIKEY")!;
--       await fetch(
--         `https://api.callmebot.com/whatsapp.php?phone=923094499940&text=${text}&apikey=${key}`
--       );
--       // optionally update lead's wa_status via service client…
--       return new Response("ok");
--     });
--
--     The Next.js app ALSO pushes leads itself (webhook_url in Settings),
--     so this section is an alternative when serving the site from Supabase.
-- ============================================================================
