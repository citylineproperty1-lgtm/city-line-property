// One-off seed: creates the Post table (raw SQL — dev-server-safe) and
// inserts 3 launch articles for the Property Digest.
// Run: bun run prisma/seed-posts.ts
import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const db = new PrismaClient();

interface SeedPost {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  tag: string;
  cover: string | null;
}

const POSTS: SeedPost[] = [
  {
    title: "Why Etihad Town Phase 1 is Lahore's smartest buy right now",
    slug: "why-etihad-town-phase-1-smartest-buy",
    excerpt:
      "Ring Road access, finished infrastructure and prices still below DHA — Phase 1 has quietly become the best value per marla on Lahore's west side.",
    tag: "Market notes",
    cover: "/images/properties/plot-residential-1.png",
    content: `Every month we walk dozens of plots in Etihad Town Phase 1 with buyers from Lahore and overseas, and the same question comes up: why here?

The short answer is infrastructure. Phase 1 is fully built-out — metaled roads, underground electricity, running sewerage and a working park network. You are not buying a promise on a brochure, you are buying a street that already exists.

## The numbers

Average asking prices in Phase 1 sit roughly 35–45% below comparable DHA phases, while Ring Road puts Mall Road within an easy drive. For families living in Johar Town or Bahria, that price gap is the whole story: same finished society feel, materially lower entry.

## What we tell first-time buyers

1. Buy on a wide street near a park — liquidity is dramatically better on resale.
2. Check the file type (cash or allotment) before negotiating.
3. Expect 5–8% yearly growth in normal years; windfall years happen when a nearby interchange opens.

Come by the office at 151-C, Etihad Town Phase 1 — we will walk you through live options over a cup of chai, and our commission is a flat 1%.`,
  },
  {
    title: "1% commission, explained: what direct dealing actually saves you",
    slug: "one-percent-commission-explained",
    excerpt:
      "The traditional Lahore broker chain quietly adds 2–4% to every deal. Here is the arithmetic of why we charge 1% — and what it saves on a 2 crore plot.",
    tag: "Guides",
    cover: null,
    content: `Most property deals in Lahore pass through three or four hands: the area broker, the sub-agent, the "investor" and sometimes the dealer's office. Each adds their margin, and nobody writes it on a receipt.

We built City Line Property around the opposite model: one office, one commission, printed on paper.

## The arithmetic

On a PKR 2 crore residential plot:

- Traditional chain (2–4% across hands): PKR 400,000 – 800,000 in hidden margins
- City Line Property (1%, confirmed in writing): PKR 200,000 — and nothing else

That difference is a car, a wedding budget, or the furnishing of the house you are about to build.

## What "direct dealing" means in practice

The seller knows exactly what we are asking. The buyer knows exactly what the seller wants. There is no invented "owner's price" and no last-minute commission surprise at the registry. Rentals are charged at an agreed flat rate, separately, before we start.

If any office ever quotes you more than 1%, ask them to put it in writing — then come see us.`,
  },
  {
    title: "Plot vs house vs apartment: where should your first 1.5 crore go?",
    slug: "plot-vs-house-vs-apartment-first-crore",
    excerpt:
      "Three buyers, three budgets, three very different outcomes. A practical walkthrough of capital growth, rental yield and holding cost in Etihad Town's five blocks.",
    tag: "Guides",
    cover: "/images/properties/plot-commercial-1.png",
    content: `A family walks into our office with PKR 1.5 crore and one question: "where does this work hardest?" The answer depends on what they need in five years, not just what grows fastest.

## The plot: pure capital growth

A 5 marla residential plot in Phase 2 or Overseas Block is the simplest hold — no maintenance, no tenants, lowest entry cost. Growth tracks society development milestones. Downside: zero income while you hold.

## The house: use it while it grows

A 3 marla or 5 marla house trades some capital growth for immediate usability. For overseas Pakistanis, a ready house in Royal Enclave that a trusted relative can occupy is often worth more than a faster-growing file.

## The apartment: rent does the work

Apartments and studios in Phase 1 currently yield roughly 4–5% gross rental — the strongest income on our books. Flats near the Main Boulevard rent within weeks.

## Our rule of thumb

Buying to hold 3+ years with no income needed? Plot. Need a home within a year? House. Want monthly cash flow? Apartment or studio. Then come talk to us — the chai is on us either way.`,
  },
];

async function main() {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Post" (
      "id"        TEXT PRIMARY KEY NOT NULL,
      "title"     TEXT NOT NULL,
      "slug"      TEXT NOT NULL UNIQUE,
      "excerpt"   TEXT NOT NULL DEFAULT '',
      "content"   TEXT NOT NULL DEFAULT '',
      "cover"     TEXT,
      "tag"       TEXT NOT NULL DEFAULT 'Market notes',
      "author"    TEXT NOT NULL DEFAULT 'City Line Property',
      "published" BOOLEAN NOT NULL DEFAULT 1,
      "views"     INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL,
      "updatedAt" DATETIME NOT NULL
    )
  `);
  console.log("Post table ready");

  // Stagger createdAt across recent days so ordering is realistic.
  let dayOffset = 2;
  for (const p of POSTS) {
    const exists = (await db.$queryRawUnsafe(
      `SELECT id FROM "Post" WHERE slug = ? LIMIT 1`,
      p.slug
    )) as unknown[];
    if (exists.length > 0) {
      console.log(`skip (exists): ${p.slug}`);
      dayOffset -= 1;
      continue;
    }
    const created = new Date();
    created.setDate(created.getDate() - dayOffset);
    created.setHours(10 + dayOffset, 30, 0, 0);
    dayOffset = Math.max(dayOffset - 1, 0);
    await db.$executeRawUnsafe(
      `INSERT INTO "Post" ("id","title","slug","excerpt","content","cover","tag","author","published","views","createdAt","updatedAt")
       VALUES (?,?,?,?,?,?,?,?,'1',0,?,?)`,
      randomUUID(),
      p.title,
      p.slug,
      p.excerpt,
      p.content,
      p.cover,
      p.tag,
      "City Line Property",
      created.getTime(),
      created.getTime()
    );
    console.log(`seeded: ${p.slug}`);
  }
  console.log("done");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
