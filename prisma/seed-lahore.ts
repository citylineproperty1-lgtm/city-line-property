/**
 * City Line Property — Lahore seed (canonical, slim).
 * Wipes and reseeds: categories, inventory (5 areas × 7 categories),
 * demo leads, admin user and settings.
 *
 * Run: bun prisma/seed-lahore.ts
 */
import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

const IMG = (n: string) => `/images/properties/${n}`;

async function main() {
  console.log("🌱 Seeding City Line Property (Lahore)…");

  // ---- wipe ----
  await db.lead.deleteMany();
  await db.property.deleteMany();
  await db.category.deleteMany();
  await db.setting.deleteMany();
  await db.adminUser.deleteMany();

  // ---- categories (the 7 we deal in) ----
  const categories = [
    { name: "Residential Plots", slug: "residential-plots", icon: "LandPlot", color: "#34C759", description: "3 Marla to 1 Kanal residential plots in every block", sortOrder: 1 },
    { name: "Commercial Plots", slug: "commercial-plots", icon: "Store", color: "#FF9500", description: "Main-boulevard commercial plots with high footfall", sortOrder: 2 },
    { name: "Houses", slug: "houses", icon: "Home", color: "#A2845E", description: "Brand-new and pre-owned houses, ready to move", sortOrder: 3 },
    { name: "Apartments", slug: "apartments", icon: "Building2", color: "#30B0C7", description: "Modern apartments with premium amenities", sortOrder: 4 },
    { name: "Commercial Halls", slug: "commercial-halls", icon: "Warehouse", color: "#AF52DE", description: "Halls and warehouses for business & investment", sortOrder: 5 },
    { name: "Flat / Studio", slug: "flat-studio", icon: "BedDouble", color: "#FF2D55", description: "Compact flats and studios, ideal first investment", sortOrder: 6 },
    { name: "For Rent", slug: "for-rent", icon: "KeyRound", color: "#007AFF", description: "Houses, apartments and halls available on rent", sortOrder: 7 },
  ];
  for (const c of categories) await db.category.create({ data: c });
  console.log(`  ✓ ${categories.length} categories`);

  // ---- inventory ----
  type P = {
    title: string; price: number; status: string; type: string; beds: number; baths: number;
    area: number; address: string; district: string; images: string[]; amenities: string[];
    featured?: boolean; listingState?: string; yearBuilt: number; parking: number;
    description: string; views: number;
  };

  const AMEN_PLOT = ["Boundary wall", "Gated society", "Underground electricity", "Park facing"];
  const AMEN_HOUSE = [" Attached bath", "Drawing room", "Servant quarter", "Roof terrace", "Car porch"];
  const AMEN_APART = ["Lift", "Security", "Backup power", "Parking", "Prayer area"];
  const AMEN_HALL = ["Loading dock", "Office cabin", "Washrooms", "3-phase power", "Fire exit"];

  const properties: P[] = [
    {
      title: "5 Marla Residential Plot — Block A, Near Main Boulevard",
      price: 8900000, status: "SALE", type: "residential-plots", beds: 0, baths: 0, area: 1361,
      address: "Block A, near Main Boulevard", district: "Etihad Town Phase 1",
      images: [IMG("plot-residential-1.png")], amenities: AMEN_PLOT,
      yearBuilt: 2024, parking: 0, views: 142,
      description: "Ideal 5 marla plot in the heart of Etihad Town Phase 1, a two-minute walk from the main boulevard. Level ground, demarcated, and ready for immediate possession. Only 1% commission — direct dealing with the office.",
    },
    {
      title: "3 Marla Residential Plot — Block C, Quiet Street",
      price: 5200000, status: "SALE", type: "residential-plots", beds: 0, baths: 0, area: 817,
      address: "Block C, 30 ft street", district: "Etihad Town Phase 2",
      images: [IMG("plot-residential-1.png")], amenities: AMEN_PLOT,
      yearBuilt: 2024, parking: 0, views: 89,
      description: "Affordable 3 marla plot on a quiet 30-ft street in Phase 2. Perfect first investment or small-family home site. Transfer fees clear, no dues.",
    },
    {
      title: "10 Marla Residential Plot — Royal Enclave Block B",
      price: 18500000, status: "SALE", type: "residential-plots", beds: 0, baths: 0, area: 2722,
      address: "Block B, 40 ft boulevard", district: "Royal Enclave",
      images: [IMG("plot-residential-1.png")], amenities: AMEN_PLOT,
      yearBuilt: 2024, parking: 0, views: 120,
      description: "Spacious 10 marla plot on a 40-ft boulevard in Royal Enclave. Corner-adjacent, park + mosque in walking distance. Genuine seller, market price.",
    },
    {
      title: "1 Kanal Corner Plot — Overseas Block",
      price: 41000000, status: "SALE", type: "residential-plots", beds: 0, baths: 0, area: 5445,
      address: "Overseas Block, corner 60 ft road", district: "Overseas Block",
      images: [IMG("plot-residential-1.png")], amenities: ["Corner plot", "Boundary wall", "Gated society", "Underground electricity"],
      featured: true, yearBuilt: 2024, parking: 0, views: 231,
      description: "Premium 1 kanal corner plot in the Overseas Block — double-road access, south-west open. The society's most sought-after category for overseas buyers.",
    },
    {
      title: "4 Marla Commercial Plot — Main Boulevard",
      price: 26000000, status: "SALE", type: "commercial-plots", beds: 0, baths: 0, area: 1089,
      address: "Main Boulevard commercial strip", district: "Etihad Town Phase 1",
      images: [IMG("plot-commercial-1.png")], amenities: ["Main boulevard", "High footfall", "Commercial zoning"],
      featured: true, yearBuilt: 2024, parking: 0, views: 198,
      description: "Rare 4 marla commercial plot directly on the Phase 1 main boulevard. Suit showroom, bank, or plaza. Highest footfall strip in the society.",
    },
    {
      title: "2.5 Marla Commercial Plot — Premier Enclave Commercial Zone",
      price: 14500000, status: "SALE", type: "commercial-plots", beds: 0, baths: 0, area: 681,
      address: "Commercial Zone, 50 ft road", district: "Premier Enclave",
      images: [IMG("plot-commercial-1.png")], amenities: ["Commercial zoning", "Wide road", "Gated society"],
      yearBuilt: 2024, parking: 0, views: 76,
      description: "Compact commercial plot in Premier Enclave's designated market zone. Ideal for a clinic, mini-mart or franchise outlet.",
    },
    {
      title: "5 Marla Brand-New House — Modern Open Design",
      price: 21500000, status: "SALE", type: "houses", beds: 4, baths: 4, area: 2100,
      address: "Block D, 30 ft street", district: "Etihad Town Phase 1",
      images: [IMG("house-1.jpg"), IMG("kitchen-1.jpg"), IMG("bedroom-1.jpg")], amenities: AMEN_HOUSE,
      featured: true, yearBuilt: 2024, parking: 1, views: 305,
      description: "Brand-new 5 marla house, never lived in. Open-plan lounge, modular kitchen, four attached bedrooms, roof terrace with city view. Move-in ready.",
    },
    {
      title: "10 Marla Designer House — 4 Beds with Lawn",
      price: 38500000, status: "SALE", type: "houses", beds: 5, baths: 6, area: 4200,
      address: "Block A, 40 ft boulevard", district: "Royal Enclave",
      images: [IMG("villa-1.jpg"), IMG("villa-2.jpg"), IMG("bedroom-1.jpg")], amenities: [...AMEN_HOUSE, "Lawn", "Study room"],
      yearBuilt: 2022, parking: 2, views: 174,
      description: "Designer 10 marla residence in Royal Enclave — double-height entrance, imported fittings, two car porches and a landscaped lawn.",
    },
    {
      title: "3 Marla House — Ideal Small Family Home",
      price: 13500000, status: "SALE", type: "houses", beds: 3, baths: 3, area: 1250,
      address: "Block C, 25 ft street", district: "Premier Enclave",
      images: [IMG("townhouse-1.jpg"), IMG("kitchen-1.jpg")], amenities: AMEN_HOUSE,
      yearBuilt: 2021, parking: 1, views: 98,
      description: "Neat 3 marla house in Premier Enclave — three bedrooms, draw-dining, and a quiet street. A genuine bargain at market rate.",
    },
    {
      title: "3-Bed Luxury Apartment — Park Facing",
      price: 10800000, status: "SALE", type: "apartments", beds: 3, baths: 3, area: 1650,
      address: "Central Avenue, 3rd floor", district: "Etihad Town Phase 2",
      images: [IMG("apartment-ext-1.png"), IMG("apartment-1.jpg"), IMG("apartment-2.jpg")], amenities: AMEN_APART,
      featured: true, yearBuilt: 2023, parking: 1, views: 262,
      description: "Park-facing 3-bed apartment with lift, backup power and 24/7 security. Located on Central Avenue, minutes from the Phase 2 gate.",
    },
    {
      title: "2-Bed Apartment — Bank Allocated",
      price: 8500000, status: "SALE", type: "apartments", beds: 2, baths: 2, area: 1100,
      address: "Block B, 2nd floor", district: "Overseas Block",
      images: [IMG("apartment-2.jpg"), IMG("apartment-1.jpg")], amenities: AMEN_APART,
      yearBuilt: 2022, parking: 1, views: 133,
      description: "Well-built 2-bed unit in the Overseas Block — bank allocated, clean file, strong rental demand from the nearby commercial district.",
    },
    {
      title: "Studio Flat — Furnished, High Rental Yield",
      price: 5800000, status: "SALE", type: "flat-studio", beds: 1, baths: 1, area: 620,
      address: "Main Boulevard, 4th floor", district: "Etihad Town Phase 1",
      images: [IMG("loft-1.jpg"), IMG("bedroom-1.jpg")], amenities: [...AMEN_APART, "Furnished"],
      yearBuilt: 2023, parking: 0, views: 187,
      description: "Fully furnished studio on the main boulevard — the easiest entry into Etihad Town property. Tenants currently paying PKR 38,000/month.",
    },
    {
      title: "Commercial Hall — 8,000 sqft on Main Boulevard",
      price: 68000000, status: "SALE", type: "commercial-halls", beds: 0, baths: 3, area: 8000,
      address: "Main Boulevard commercial strip", district: "Etihad Town Phase 2",
      images: [IMG("commercial-hall-1.png"), IMG("office-1.jpg")], amenities: AMEN_HALL,
      featured: true, yearBuilt: 2021, parking: 10, views: 149,
      description: "Purpose-built 8,000 sqft commercial hall on the Phase 2 main boulevard — loading dock, mezzanine office cabin, ten-car parking. Ideal for distribution or a franchise.",
    },
    {
      title: "5 Marla House on Rent — Family Home",
      price: 95000, status: "RENT", type: "for-rent", beds: 3, baths: 3, area: 1800,
      address: "Block D, 30 ft street", district: "Etihad Town Phase 1",
      images: [IMG("house-1.jpg"), IMG("bedroom-1.jpg")], amenities: AMEN_HOUSE,
      yearBuilt: 2020, parking: 1, views: 121,
      description: "Well-maintained 5 marla family house available immediately. Three bedrooms, draw-dining, car porch. Two advances, one month commission (1%).",
    },
    {
      title: "3-Bed Apartment on Rent — Semi-Furnished",
      price: 78000, status: "RENT", type: "for-rent", beds: 3, baths: 3, area: 1650,
      address: "Central Avenue, 5th floor", district: "Overseas Block",
      images: [IMG("apartment-1.jpg"), IMG("apartment-ext-1.png")], amenities: AMEN_APART,
      yearBuilt: 2023, parking: 1, views: 96,
      description: "Semi-furnished 3-bed apartment with lift and backup. Family or bachelors (executives) welcome. Walking distance from the commercial strip.",
    },
    {
      title: "Commercial Hall on Rent — Main Road Phase 1",
      price: 285000, status: "RENT", type: "for-rent", beds: 0, baths: 2, area: 5200,
      address: "Main Road commercial strip", district: "Etihad Town Phase 1",
      images: [IMG("commercial-hall-1.png"), IMG("office-1.jpg")], amenities: AMEN_HALL,
      yearBuilt: 2020, parking: 6, views: 88,
      description: "5,200 sqft hall on the Phase 1 main road — suits a brand outlet, gym or software house. Power 15 kW, dedicated parking.",
    },
  ];

  const now = Date.now();
  for (let i = 0; i < properties.length; i++) {
    const p = properties[i];
    await db.property.create({
      data: {
        ...p,
        slug: p.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) + `-${i + 1}`,
        reference: `CLP-${101 + i}`,
        city: "Lahore",
        images: JSON.stringify(p.images),
        amenities: JSON.stringify(p.amenities.map((a) => a.trim())),
        featured: Boolean(p.featured),
        listingState: p.listingState ?? "AVAILABLE",
        published: true,
        createdAt: new Date(now - (properties.length - i) * 36 * 3600 * 1000),
      },
    });
  }
  console.log(`  ✓ ${properties.length} listings (5 areas × 7 categories)`);

  // ---- demo leads (so the CRM inbox isn't empty) ----
  const hall = await db.property.findFirst({ where: { type: "commercial-halls" } });
  await db.lead.createMany({
    data: [
      {
        name: "Ahmed Raza", phone: "0300 1234567", email: "ahmed.raza@example.com",
        category: "residential-plots", area: "Etihad Town Phase 1", budget: 9000000,
        message: "Looking for a 5 marla plot in Phase 1, cash purchase, need possession-ready. Please share options.",
        source: "REQUIREMENT", status: "NEW", waStatus: "SKIPPED",
      },
      {
        name: "Sana Khalid", phone: "0321 5550182",
        category: "apartments", area: "Etihad Town Phase 2", budget: 11000000,
        message: "Need a 3-bed apartment, park facing preferred. Can visit this weekend.",
        source: "WEBSITE", status: "CONTACTED", waStatus: "SKIPPED",
      },
      {
        name: "Usman Ghani", phone: "0333 7700211",
        message: "Interested in the 8000 sqft hall. Is the mezzanine included in the quoted price?",
        propertyId: hall?.id ?? null, source: "PROPERTY", status: "NEGOTIATION", waStatus: "SKIPPED",
      },
    ],
  });
  console.log("  ✓ 3 demo leads");

  // ---- settings ----
  const settings = [
    { key: "whatsapp_number", value: "923094499940" },
    { key: "whatsapp_number_2", value: "923218422109" },
    { key: "office_address", value: "151-C, Etihad Town Phase 1, Lahore" },
    { key: "business_email", value: "citylineproperty1@gmail.com" },
    { key: "office_hours", value: "Mon–Sat · 9:00 AM – 7:00 PM" },
    { key: "webhook_url", value: "" },
  ];
  for (const s of settings) await db.setting.create({ data: s });
  console.log("  ✓ settings (WhatsApp 0309 4499940, webhook empty)");

  // ---- admin user ----
  await db.adminUser.create({
    data: {
      email: (process.env.ADMIN_SEED_EMAIL || "admin@citylineproperty.com").toLowerCase(),
      name: "City Line Admin",
      passwordHash: hashPassword(process.env.ADMIN_SEED_PASSWORD || "CityLine@2025"),
    },
  });
  console.log("  ✓ admin user — admin@citylineproperty.com / CityLine@2025 (change from panel)");

  console.log("🌱 Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
