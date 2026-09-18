# City Line Property — Supabase Setup Guide

This folder contains everything needed to move the CRM's data layer to your
Supabase project (`laoawjnasrhhnaxsdzgb.supabase.co`).

## 1. Run the SQL

1. Supabase Dashboard → **SQL Editor** → New query.
2. Paste the whole of [`schema.sql`](./schema.sql) → **Run**.
3. You now have: tables, enums, indexes, triggers, RLS, the
   `property-images` storage bucket, and full seed data
   (7 categories · 3 team members · 16 Lahore listings · 4 testimonials ·
   settings · admin account · 3 sample leads).

## 2. Admin account

| | |
|---|---|
| Login URL | `https://YOUR-DOMAIN/#/admin` (never linked on the public site) |
| Email | `admin@citylineproperty.com` |
| Password | `CityLine@2025` |

⚠️ Change the password immediately from **Admin → Settings → Change password**.
The hash is scrypt (`salt:hash`) — the same algorithm the Next.js app uses, so
the app and SQL seed stay compatible.

## 3. WhatsApp lead delivery (no official API needed)

Every lead submitted on the website is **always** stored in the `leads` table
(→ Admin panel → Leads). To ALSO get it on your WhatsApp automatically:

### Option A — built into the Next.js app (works today)
1. Register your number with **CallMeBot**: from your WhatsApp, send
   `I allow callmebot to send me messages` to **+34 644 51 95 23**.
   You receive an apikey.
2. Admin panel → **Settings → WhatsApp webhook** → paste:
   ```
   https://api.callmebot.com/whatsapp.php?phone=923094499940&text={MESSAGE}&apikey=YOUR_KEY
   ```
3. Press **Test** — a test message arrives in your WhatsApp.
   From now on every website lead is pushed there automatically
   (`{MESSAGE}` is replaced with the formatted lead brief).

Any Make.com / n8n / Zapier / self-hosted gateway URL also works — URLs
without `{MESSAGE}` receive a JSON POST with the full lead object.

### Option B — Supabase Database Webhook / Edge Function
See section 11 at the bottom of `schema.sql` for a ready-made Edge Function
sketch that forwards every inserted `leads` row to CallMeBot.

### Front-page WhatsApp buttons
The floating WhatsApp button, header button and form confirmations all open
`https://wa.me/923094499940?text=…` — the visitor's own WhatsApp opens with a
prefilled chat addressed to your real number. No API, no bot, direct chat.

## 4. Environment variables (already in `.env.local`)

```
NEXT_PUBLIC_SUPABASE_URL=https://laoawjnasrhhnaxsdzgb.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_…
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ…            (legacy JWT anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ…                (server-side only — never expose)
```

The sandbox app currently runs on Prisma + SQLite (self-contained, no network
dependency). When you're ready to serve production data from Supabase, swap
the Prisma datasource for Postgres (`provider = "postgresql"` with the
Supabase connection string) — the schema in `schema.sql` matches the Prisma
models 1:1, including field names.

## 5. Security model

- **anon key** (public site): can read published listings/categories/team/
  testimonials and INSERT leads/newsletter rows only.
- **service_role key** (trusted backend only): full access — CRM inbox,
  inventory editing, settings. Never ship it to the browser.
- `admin_users`, `settings`, `view_events` have no anon policies at all.
- The admin panel is reachable **only** by typing `/#/admin`; nothing on the
  public site links to it.
