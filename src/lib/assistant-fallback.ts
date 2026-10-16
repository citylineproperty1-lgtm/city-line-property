/**
 * CLP Assistant — offline ("lite") brain.
 *
 * Used whenever the Z.ai SDK is NOT configured (production deploys without
 * the ZAI_* env vars) or when the AI call fails. Pure keyword/regex
 * understanding — no AI, no cost, no secrets: visitors still get working
 * search, property details and business info straight from the live
 * database, with the same reply/card contract the AI mode uses.
 *
 * Mutations (add/remove listings) are deliberately NOT supported here —
 * they answer with a pointer to the Admin panel / full AI mode.
 */

import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { serializeProperty } from "@/lib/serialize";
import { formatPKR } from "@/lib/format";
import type { Property } from "@/lib/types";

export type FallbackResult = {
  reply: string;
  properties: Property[];
  action?: string;
};

const CATEGORIES = [
  "residential-plots",
  "commercial-plots",
  "houses",
  "apartments",
  "commercial-halls",
  "flat-studio",
  "for-rent",
];

const DISTRICTS = [
  "Etihad Town Phase 1",
  "Etihad Town Phase 2",
  "Royal Enclave",
  "Premier Enclave",
  "Overseas Block",
];

const HELP_TEXT = [
  "I can help with:",
  '• Search — "3 marla plot in Etihad Phase 1", "houses under 2 crore"',
  '• Details — just type a reference like "CLP-117"',
  "• Info — commission, office address, phone, timings",
].join("\n");

const MUTATION_TEXT = [
  "Adding or removing listings by chat/voice needs the full AI mode, which is not switched on for this site yet.",
  "Meanwhile you can manage listings from the Admin panel — or call us on 0309 4499940 and we will do it for you.",
].join("\n");

// ---------------------------------------------------------------- parsers

const UNIT_VALUE: Record<string, number> = {
  crore: 10_000_000,
  crores: 10_000_000,
  cr: 10_000_000,
  lac: 100_000,
  lacs: 100_000,
  lakh: 100_000,
  lakhs: 100_000,
};

function normalizeType(input: string): string {
  const q = input.toLowerCase().trim();
  if (CATEGORIES.includes(q)) return q;
  if (q.includes("commercial plot")) return "commercial-plots";
  if (q.includes("residential plot")) return "residential-plots";
  if (q.includes("plot")) return "residential-plots";
  if (q.includes("hall")) return "commercial-halls";
  if (q.includes("studio") || q.includes("flat")) return "flat-studio";
  if (q.includes("apartment")) return "apartments";
  if (q.includes("house") || q.includes("home")) return "houses";
  if (q.includes("rent")) return "for-rent";
  return input.trim();
}

function normalizeDistrict(input: string): string {
  const q = input.toLowerCase().trim();
  if (!q) return "";
  if (/(phase\s*2|phase\s*two)/.test(q)) return "Etihad Town Phase 2";
  if (/(phase\s*1|phase\s*one)/.test(q)) return "Etihad Town Phase 1";
  if (/(etihad|ettie|eta\s*had|etehad|e\s*tihad)/.test(q)) return "Etihad Town Phase 1";
  if (q.includes("royal")) return "Royal Enclave";
  if (q.includes("premier")) return "Premier Enclave";
  if (q.includes("overseas")) return "Overseas Block";
  const exact = DISTRICTS.find((d) => d.toLowerCase() === q);
  return exact ?? input.trim();
}

/** All money amounts mentioned with a unit ("2 crore", "80 lac", "35 lacs"). */
function moneyMentions(text: string): Array<{ value: number; index: number }> {
  const out: Array<{ value: number; index: number }> = [];
  for (const m of text.matchAll(
    /(\d+(?:\.\d+)?)\s*(crore|crores|cr|lac|lacs|lakh|lakhs)\b/g
  )) {
    const unit = UNIT_VALUE[m[2]] ?? 100_000;
    out.push({ value: Number(m[1]) * unit, index: m.index ?? 0 });
  }
  return out;
}

type Filters = {
  status?: "SALE" | "RENT";
  type?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  area?: number; // exact sqft (from marla/kanal/sqft mentions)
  query?: string;
};

function parseFilters(raw: string): Filters {
  const m = raw.toLowerCase().replace(/\s+/g, " ").trim();
  const f: Filters = {};

  // status
  if (/\b(rent|rental|to\s*let)\b/.test(m)) f.status = "RENT";
  else if (/\b(sale|buy|purchase|selling)\b/.test(m)) f.status = "SALE";

  // type (only concrete property kinds — "rent" is status, handled above)
  const concrete = m
    .replace(/\brent(al)?\b/g, " ")
    .replace(/\bsale\b|\bbuy\b|\bpurchase\b/g, " ");
  const t = normalizeType(concrete);
  if (t && CATEGORIES.includes(t)) f.type = t;

  // district (only when it maps to a known one)
  const d = normalizeDistrict(m);
  if (d && DISTRICTS.includes(d)) f.district = d;

  // beds
  const beds = /\b(\d{1,2})\s*-?\s*(?:bed|beds|bedroom|bedrooms|bhk)\b/.exec(m);
  if (beds) f.beds = Math.min(Number(beds[1]), 20);

  // area: marla / kanal / explicit sqft
  const marla = /\b(\d+(?:\.\d+)?)\s*marla\b/.exec(m);
  const kanal = /\b(\d+(?:\.\d+)?)\s*kanal\b/.exec(m);
  const sqft = /\b(\d{3,5})\s*(?:sq\.?\s*ft|sqft|square\s*feet)\b/.exec(m);
  if (marla) f.area = Math.round(Number(marla[1]) * 225);
  else if (kanal) f.area = Math.round(Number(kanal[1]) * 20 * 225);
  else if (sqft) f.area = Number(sqft[1]);

  // prices: cues decide min vs max; a lone amount reads as a budget (max)
  const amounts = moneyMentions(m);
  if (amounts.length) {
    const between =
      /\b(?:between|from)\s+(\d+(?:\.\d+)?)\s*(crore|crores|cr|lac|lacs|lakh|lakhs)?\s*(?:and|to|-)\s*(\d+(?:\.\d+)?)\s*(crore|crores|cr|lac|lacs|lakh|lakhs)?\b/.exec(
        m
      );
    if (between) {
      const lo = Number(between[1]) * (between[2] ? UNIT_VALUE[between[2]] : 100_000);
      const hi = Number(between[3]) * (between[4] ? UNIT_VALUE[between[4]] : 100_000);
      f.minPrice = Math.min(lo, hi);
      f.maxPrice = Math.max(lo, hi);
    } else {
      let min: number | null = null;
      let max: number | null = null;
      for (const a of amounts) {
        const before = m.slice(Math.max(0, a.index - 24), a.index);
        if (/\b(under|below|less than|max|upto|up to|within|cheaper)\b/.test(before)) {
          max = max === null ? a.value : Math.min(max, a.value);
        } else if (/\b(above|over|more than|starting|minimum|min|greater)\b/.test(before)) {
          min = min === null ? a.value : Math.max(min, a.value);
        } else {
          // uncued amount — treat as budget ceiling
          max = max === null ? a.value : Math.min(max, a.value);
        }
      }
      if (min !== null) f.minPrice = min;
      if (max !== null) f.maxPrice = max;
    }
  } else {
    // unit-less budget: "under 80" → 80 lac
    const bare = /\b(?:under|below|less than|within|upto|up to|max)\s+(\d{1,4})\b/.exec(m);
    if (bare) {
      const n = Number(bare[1]);
      f.maxPrice = n < 1000 ? n * 100_000 : n;
    }
  }

  // leftover keywords for the text needle (max 2 words, like the AI prompt).
  // Words already extracted as filters are stopped so the needle stays clean.
  const STOP = new Set([
    "show","me","find","give","any","the","a","an","in","at","for","of","with","and","or",
    "please","want","need","looking","look","search","price","budget","list","listings",
    "property","properties","marla","kanal","sqft","bed","beds","bedroom","bedrooms","bhk",
    "crore","crores","cr","lac","lacs","lakh","lakhs","under","below","less","than","above",
    "over","more","from","between","upto","up","to","within","max","minimum","about","is",
    "are","there","do","you","have","available","city","line","clp","phase","town","etihad",
    "house","houses","plot","plots","flat","flats","apartment","apartments","hall","halls",
    "studio","rent","rental","sale","buy","purchase","new","latest","all","everything",
    "recent","posted","near","corner",
  ]);
  const words = m
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP.has(w));
  if (words.length) f.query = words.slice(0, 2).join(" ");

  return f;
}

// ---------------------------------------------------------------- search

async function searchListings(f: Filters) {
  const buildWhere = (useQuery: boolean): Prisma.PropertyWhereInput => {
    const where: Prisma.PropertyWhereInput = { published: true };
    if (f.status) where.status = f.status;
    if (f.type && CATEGORIES.includes(f.type)) {
      // In Pakistani usage "flat" and "apartment" are the same thing — the
      // site stores them as two categories, so search both together.
      where.type =
        f.type === "flat-studio" || f.type === "apartments"
          ? { in: ["flat-studio", "apartments"] }
          : f.type;
    }
    if (f.district && DISTRICTS.includes(f.district)) where.district = f.district;
    if (f.minPrice || f.maxPrice) {
      where.price = {
        ...(f.minPrice ? { gte: f.minPrice } : {}),
        ...(f.maxPrice ? { lte: f.maxPrice } : {}),
      };
    }
    if (f.beds) where.beds = { gte: f.beds };
    if (f.area) {
      // ±15 sqft tolerance absorbs marla→sqft rounding
      where.area = { gte: f.area - 15, lte: f.area + 15 };
    }
    if (useQuery && f.query) {
      where.OR = [
        { title: { contains: f.query, mode: "insensitive" } },
        { district: { contains: f.query, mode: "insensitive" } },
        { address: { contains: f.query, mode: "insensitive" } },
        { reference: { equals: f.query, mode: "insensitive" } },
        { description: { contains: f.query, mode: "insensitive" } },
      ];
    }
    return where;
  };

  const opts = { orderBy: { createdAt: "desc" as const }, take: 5 };

  let rows = await db.property.findMany({ ...opts, where: buildWhere(true) });
  if (rows.length === 0 && f.query) {
    // keyword needle killed everything — retry with structured filters only
    rows = await db.property.findMany({ ...opts, where: buildWhere(false) });
  }
  // "for rent" is also a category on this site — if the status search found
  // nothing, try the category before giving up
  if (rows.length === 0 && f.status === "RENT") {
    rows = await db.property.findMany({
      ...opts,
      where: { ...buildWhere(false), status: undefined, type: "for-rent" },
    });
  }
  return rows;
}

// ---------------------------------------------------------------- replies

function detailsReply(p: Property): string {
  const bits: string[] = [];
  if (p.beds) bits.push(`${p.beds} bed`);
  if (p.baths) bits.push(`${p.baths} bath`);
  if (p.area) bits.push(`${(p.area / 225).toFixed(2)} marla (${p.area} sqft)`);
  const lines = [
    `${p.title} (${p.reference})`,
    `${formatPKR(p.price)}${p.status === "RENT" ? " per month" : ""} · ${p.type.replace(/-/g, " ")}`,
    `Location: ${p.district}, ${p.city}`,
  ];
  if (bits.length) lines.push(bits.join(" · "));
  const desc = (p.description ?? "").trim();
  if (desc && desc !== p.title) {
    lines.push("", `${desc.slice(0, 220)}${desc.length > 220 ? "…" : ""}`);
  }
  lines.push("", "Want to visit? Call 0309 4499940 — open Mon-Sun 10AM-8PM.");
  return lines.join("\n");
}

function businessReply(m: string): string | null {
  const lines: string[] = [];
  if (/(commission|charge|fee|cost|%|percent)/.test(m)) {
    lines.push("Commission: only 1% — the lowest in the market.");
  }
  if (/(phone|contact|number|whatsapp|call|talk)/.test(m)) {
    lines.push("Phones: 0309 4499940 or 0321 8422109.");
  }
  if (/(address|location|office|where|visit)/.test(m)) {
    lines.push("Office: 151-C Etihad Town Phase 1, Lahore.");
  }
  if (/(hours?|timing|open|close|when|working)/.test(m)) {
    lines.push("Open Mon-Sun, 10AM-8PM.");
  }
  return lines.length ? lines.join("\n") : null;
}

// ---------------------------------------------------------------- entry

export async function fallbackAnswer(message: string): Promise<FallbackResult> {
  const m = message.toLowerCase().trim();
  const base = { properties: [] as Property[] };

  if (!m) {
    return { ...base, reply: HELP_TEXT };
  }

  // 1) mutation intent → pointer (never executed offline). Checked BEFORE
  //    details so "remove CLP-105" does not just show the listing.
  const mutVerb = /\b(add|create|post|remove|delete|del)\b/.test(m);
  const mutNoun =
    /\b(listing|listings|property|properties|plot|house|file|flat|apartment|hall)\b/.test(
      m
    );
  const hasRef = /\bclp[- ]?\d+\b/.test(m);
  if ((mutVerb && mutNoun) || (/\b(remove|delete|del)\b/.test(m) && hasRef)) {
    return { ...base, reply: MUTATION_TEXT, action: "mutation_hint" };
  }

  // 2) listing reference → full details
  const ref = /\bclp[- ]?0*(\d{1,4})\b/.exec(m);
  if (ref) {
    const reference = `CLP-${Number(ref[1])}`;
    const row = await db.property.findFirst({
      where: { OR: [{ reference }, { slug: { equals: reference } }] },
    });
    if (!row) {
      return { ...base, reply: `I could not find ${reference}. Try "show latest listings".` };
    }
    const card = serializeProperty(row);
    return { ...base, reply: detailsReply(card), properties: [card], action: "get_property" };
  }

  // 3) business info
  const biz = businessReply(m);
  if (biz) {
    return { ...base, reply: biz };
  }

  // 4) greeting / help (covers stray keystrokes too — "a", "ok", "?")
  if (/^(hi+|hello|hey|aoa|assalam[o\s-]*alaikum|salam|ok|okay|yes|a)\b/.test(m) || m.length <= 2) {
    return {
      ...base,
      reply: `Hello! 👋 Ask me about any listing.\n\n${HELP_TEXT}`,
    };
  }
  if (/(help|what can you|kya kar|options|commands)/.test(m)) {
    return { ...base, reply: HELP_TEXT };
  }

  // 5) everything else → search ("latest listings" lands here too)
  const filters = parseFilters(m);
  const rows = await searchListings(filters);
  if (rows.length === 0) {
    return {
      ...base,
      reply:
        "No match for that right now. Try a different budget or area — or call us on 0309 4499940 and we will find one for you.",
    };
  }
  const cards = rows.map(serializeProperty);
  const list = cards
    .slice(0, 4)
    .map((p) => `• ${p.reference}: ${p.title} — ${formatPKR(p.price)}`)
    .join("\n");
  return {
    ...base,
    reply: `I found ${cards.length} match${cards.length === 1 ? "" : "es"} 👇\n${list}\n\nType a reference (like ${cards[0].reference}) for full details.`,
    properties: cards,
    action: "search_properties",
  };
}
