/**
 * Area guides — editorial content for the five societies City Line Property covers.
 * Static copy lives here (client-safe); live stats come from /api/insights and
 * listings from /api/properties?search=<area>. No DB table needed — areas are
 * fixed by the business (Phase 3/4 intentionally excluded).
 */

export interface AreaGuide {
  /** Exact district name used by Property.district / listings filters. */
  name: string;
  slug: string;
  /** One-line pitch shown on cards. */
  tagline: string;
  /** 2 short paragraphs for the guide hero. */
  about: string[];
  /** Bullet highlights for the guide page. */
  highlights: string[];
  /** Good-for tags. */
  goodFor: string[];
  cover: string;
  /** Approximate position on the hand-drawn AreaMap (same coords). */
  map: { x: number; y: number };
  /** true for the flagship phase where the office sits. */
  office?: boolean;
}

export const AREA_GUIDES: AreaGuide[] = [
  {
    name: "Etihad Town Phase 1",
    slug: "etihad-town-phase-1",
    tagline: "The original Etihad address — where our office stands.",
    about: [
      "Phase 1 is the heart of the Etihad Town pocket and home to our office at 151-C. Fully developed with metalled roads, underground electricity, gas, water and a working sewerage system, it is the society people picture when they say \u201cEtihad\u201d.",
      "The Main Boulevard carries the area's commercial activity — branded outlets, clinics and restaurants — while the inner blocks stay calm and residential. Because it is the most mature phase, files here trade the fastest and banks value them highest.",
    ],
    highlights: [
      "Fully developed and mostly inhabited — real footfall, not promises",
      "Main Boulevard commercial plots with high daily foot traffic",
      "Our own office on the ground here since day one — walk-in advice is free",
      "Fastest resale velocity of the five areas",
    ],
    goodFor: ["End-users", "Commercial investment", "Quick resale"],
    cover: "/images/areas/etihad-town-phase-1.jpg",
    map: { x: 430, y: 252 },
    office: true,
  },
  {
    name: "Etihad Town Phase 2",
    slug: "etihad-town-phase-2",
    tagline: "The newer expansion — modern layouts, rising curve.",
    about: [
      "Phase 2 stretches east of Phase 1 with wider cuttings, modern sector planning and brand-new construction. It is where most of the current building activity happens — fresh houses and apartment blocks rising month by month.",
      "Prices entered earlier than Phase 1, which is exactly why investors watch it: the gap closes as development catches up. Possession plots on the main boulevard are the first to move.",
    ],
    highlights: [
      "Wider streets and modern sector planning",
      "New-build houses and apartments at earlier-cycle prices",
      "Direct continuation of the Main Boulevard corridor",
      "Strong upside as development completes",
    ],
    goodFor: ["Early investors", "New construction", "Budget plots"],
    cover: "/images/areas/etihad-town-phase-2.jpg",
    map: { x: 728, y: 226 },
  },
  {
    name: "Royal Enclave",
    slug: "royal-enclave",
    tagline: "Quiet, established streets minutes from the main gate.",
    about: [
      "Royal Enclave sits to the south-west of Phase 1 — a settled, low-traffic pocket favoured by families who want calm streets without leaving the Etihad ecosystem.",
      "House stock here is predominantly owner-built and well kept, so second-hand purchases rarely need structural surprises. Plot sizes lean towards 5 and 10 Marla family homes.",
    ],
    highlights: [
      "Peaceful, family-oriented streets with low through-traffic",
      "Solid owner-built house stock — genuine brick-and-mortar value",
      "Walking distance to Phase 1 amenities",
      "Reliable rental demand from young families",
    ],
    goodFor: ["Families", "Ready houses", "Long-term holding"],
    cover: "/images/properties/house-1.jpg",
    map: { x: 225, y: 402 },
  },
  {
    name: "Premier Enclave",
    slug: "premier-enclave",
    tagline: "Premium villa pocket with generous frontages.",
    about: [
      "Premier Enclave is the premium address of the pocket — larger frontages, wider setbacks and the most ambitious private residences in the area.",
      "Stock is limited and owners tend to hold, which keeps supply tight. When a good file does appear, it is usually the office that hears about it first — that is the benefit of being embedded here.",
    ],
    highlights: [
      "The most upscale residential pocket of the five",
      "Larger plots, wider frontages, statement villas",
      "Tight supply — quality files move through word of mouth",
      "Strong prestige and resale identity",
    ],
    goodFor: ["Premium villas", "Upgraders", "Prestige buyers"],
    cover: "/images/properties/villa-2.jpg",
    map: { x: 612, y: 420 },
  },
  {
    name: "Overseas Block",
    slug: "overseas-block",
    tagline: "Built for Pakistanis abroad — managed, secure, hands-off.",
    about: [
      "The Overseas Block was planned for Pakistanis living abroad who want Etihad exposure without day-to-day management. Boundary-controlled access, clearer documentation and modern apartment options make it the lowest-hassle entry.",
      "For overseas buyers we handle viewing videos, paperwork scans and transfer coordination directly from our office — you deal with one desk, not a chain of middlemen.",
    ],
    highlights: [
      "Designed for expat buyers — secure, documented, low-maintenance",
      "Modern apartments and compact flats with rental yield",
      "Remote purchases handled end-to-end by our office",
      "Attractive entry prices relative to finished stock",
    ],
    goodFor: ["Overseas Pakistanis", "Rental yield", "Apartments"],
    cover: "/images/properties/penthouse-1.jpg",
    map: { x: 565, y: 88 },
  },
];

export function areaSlug(name: string): string {
  return AREA_GUIDES.find((a) => a.name === name)?.slug ?? "";
}

export function areaBySlug(slug: string): AreaGuide | undefined {
  return AREA_GUIDES.find((a) => a.slug === slug);
}

export function areaByName(name: string): AreaGuide | undefined {
  return AREA_GUIDES.find((a) => a.name === name);
}
