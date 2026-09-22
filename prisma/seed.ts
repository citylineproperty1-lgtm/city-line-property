/**
 * Seed script for City Line Property — run: bun prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const V = "/images/properties";

const agents = [
  {
    name: "Ahmed Raza",
    title: "Senior Property Consultant",
    email: "ahmed@citylineproperty.pk",
    phone: "+92 300 111 2233",
    initials: "AR",
    accent: "#0d6b4f",
    bio: "With 12+ years in Karachi's prime markets, Ahmed specialises in DHA and Clifton residential portfolios and has closed over PKR 9 billion in sales.",
  },
  {
    name: "Sara Khan",
    title: "Luxury Homes Specialist",
    email: "sara@citylineproperty.pk",
    phone: "+92 321 444 5566",
    initials: "SK",
    accent: "#8a5a2b",
    bio: "Sara curates the city's most exclusive villas and penthouses, offering discreet end-to-end service for high-net-worth buyers and investors.",
  },
  {
    name: "Bilal Sheikh",
    title: "Commercial Advisor",
    email: "bilal@citylineproperty.pk",
    phone: "+92 333 777 8899",
    initials: "BS",
    accent: "#1f4d8a",
    bio: "Bilal advises corporate tenants and investors on office, retail and mixed-use assets across I.I. Chundrigar Road and Shahrah-e-Faisal.",
  },
  {
    name: "Fatima Malik",
    title: "Rentals Manager",
    email: "fatima@citylineproperty.pk",
    phone: "+92 345 222 3344",
    initials: "FM",
    accent: "#7a3b5e",
    bio: "Fatima manages a portfolio of 300+ rental units with an average tenant placement time of just 9 days.",
  },
];

type SeedProperty = {
  title: string;
  slug: string;
  description: string;
  price: number;
  status: string;
  type: string;
  beds: number;
  baths: number;
  area: number;
  address: string;
  city: string;
  district: string;
  images: string[];
  amenities: string[];
  featured?: boolean;
  yearBuilt: number;
  parking: number;
  rating: number;
  agentEmail: string;
};

const properties: SeedProperty[] = [
  {
    title: "Modern Family Villa with Landscaped Garden",
    slug: "modern-family-villa-dha-6",
    description:
      "A striking 5-bedroom family villa on a 600 sqyd corner plot in DHA Phase 6. Double-height entrance hall, imported marble flooring, a fully fitted German kitchen and a landscaped garden with mature trees. The basement hosts a home theatre and guest suite, while the rooftop terrace is wired for evening entertaining. Walking distance to the neighbourhood park and top schools.",
    price: 85_000_000,
    status: "SALE",
    type: "VILLA",
    beds: 5,
    baths: 6,
    area: 4500,
    address: "12-C, Khayaban-e-Ittehad, Phase 6",
    city: "Karachi",
    district: "DHA Phase 6",
    images: [`${V}/villa-1.jpg`, `${V}/villa-2.jpg`, `${V}/kitchen-1.jpg`],
    amenities: ["Swimming Pool", "Central AC", "Covered Parking", "Backup Power", "24/7 Security", "Garden", "Maid Room", "Smart Home"],
    featured: true,
    yearBuilt: 2021,
    parking: 3,
    rating: 4.9,
    agentEmail: "ahmed@citylineproperty.pk",
  },
  {
    title: "Skyline Penthouse with Arabian Sea Views",
    slug: "skyline-penthouse-clifton-5",
    description:
      "Perched on the 22nd floor of Clifton's most exclusive tower, this penthouse frames the Arabian Sea from every room. 3,200 sqft of open-plan living, Italian marble, a chef's kitchen and a 900 sqft wraparound terrace with a private plunge pool. Building amenities include a residents' gym, infinity pool and valet parking.",
    price: 120_000_000,
    status: "SALE",
    type: "PENTHOUSE",
    beds: 4,
    baths: 5,
    area: 4100,
    address: "Ocean Mall Tower, Block 5",
    city: "Karachi",
    district: "Clifton",
    images: [`${V}/penthouse-1.jpg`, `${V}/penthouse-2.jpg`, `${V}/bedroom-1.jpg`],
    amenities: ["Sea View", "Swimming Pool", "Gym", "Elevator", "Central AC", "Covered Parking", "24/7 Security", "Backup Power"],
    featured: true,
    yearBuilt: 2022,
    parking: 3,
    rating: 5.0,
    agentEmail: "sara@citylineproperty.pk",
  },
  {
    title: "Sunlit 3-Bed Apartment near Keamari Corridor",
    slug: "sunlit-3-bed-pechs-2",
    description:
      "A beautifully renovated 3-bedroom apartment in the heart of PECHS Block 2. Light oak floors, a bright open kitchen and a wide balcony overlooking tree-lined streets. The building has recently upgraded plumbing, two lifts and dedicated covered parking. Walking distance to supermarkets, cafés and quality schools.",
    price: 185_000,
    status: "RENT",
    type: "APARTMENT",
    beds: 3,
    baths: 3,
    area: 1850,
    address: "Block 2, PECHS",
    city: "Karachi",
    district: "PECHS",
    images: [`${V}/apartment-2.jpg`, `${V}/apartment-1.jpg`, `${V}/kitchen-1.jpg`],
    amenities: ["Balcony", "Elevator", "Central AC", "Covered Parking", "Backup Power", "24/7 Security"],
    featured: true,
    yearBuilt: 2017,
    parking: 1,
    rating: 4.7,
    agentEmail: "fatima@citylineproperty.pk",
  },
  {
    title: "Signature Villa with Private Pool, Phase 8",
    slug: "signature-villa-dha-8",
    description:
      "An architect-designed statement home on Khayaban-e-Bukhari. Floor-to-ceiling glazing, a 60-ft private pool, solar array and full building automation. The 800 sqyd plot offers rare privacy with a mature bamboo screen along the boundary. A dedicated staff annexe and 4-car garage complete the package.",
    price: 210_000_000,
    status: "SALE",
    type: "VILLA",
    beds: 6,
    baths: 7,
    area: 7200,
    address: "Khayaban-e-Bukhari, Phase 8",
    city: "Karachi",
    district: "DHA Phase 8",
    images: [`${V}/villa-2.jpg`, `${V}/villa-1.jpg`, `${V}/bedroom-1.jpg`],
    amenities: ["Swimming Pool", "Solar Panels", "Smart Home", "Gym", "Central AC", "Covered Parking", "24/7 Security", "Maid Room"],
    featured: true,
    yearBuilt: 2023,
    parking: 4,
    rating: 4.9,
    agentEmail: "sara@citylineproperty.pk",
  },
  {
    title: "Corporate Office Floor on I.I. Chundrigar Road",
    slug: "corporate-office-ii-chundrigar",
    description:
      "A full fitted floor of 6,000 sqft in the city's financial corridor. Raised flooring, fibre redundancy, 4 meeting rooms, a boardroom and 60 workstations ready to occupy. The building features high-speed lifts, dedicated backup generation and secure basement parking for 12 cars.",
    price: 650_000,
    status: "RENT",
    type: "OFFICE",
    beds: 0,
    baths: 4,
    area: 6000,
    address: "I.I. Chundrigar Road",
    city: "Karachi",
    district: "Saddar",
    images: [`${V}/office-1.jpg`, `${V}/loft-1.jpg`],
    amenities: ["Elevator", "Central AC", "Backup Power", "24/7 Security", "Covered Parking", "Fibre Internet"],
    yearBuilt: 2015,
    parking: 12,
    rating: 4.5,
    agentEmail: "bilal@citylineproperty.pk",
  },
  {
    title: "Contemporary Townhouse in Gated Precinct",
    slug: "contemporary-townhouse-gulshan-13",
    description:
      "One of only eight townhouses in a newly completed gated precinct in Gulshan-e-Iqbal Block 13. Three finished levels, a family lounge on every floor, rooftop terrace and a shared children's play area. Smart pre-wiring, solar water heating and 24/7 precinct security included.",
    price: 28_500_000,
    status: "SALE",
    type: "TOWNHOUSE",
    beds: 4,
    baths: 4,
    area: 2600,
    address: "Block 13-D, Gulshan-e-Iqbal",
    city: "Karachi",
    district: "Gulshan-e-Iqbal",
    images: [`${V}/townhouse-1.jpg`, `${V}/kitchen-1.jpg`, `${V}/bedroom-1.jpg`],
    amenities: ["Garden", "Covered Parking", "Backup Power", "24/7 Security", "Solar Panels", "Community Park"],
    yearBuilt: 2022,
    parking: 2,
    rating: 4.6,
    agentEmail: "ahmed@citylineproperty.pk",
  },
  {
    title: "Designer Loft in Bath Island",
    slug: "designer-loft-bath-island",
    description:
      "A one-of-a-kind loft conversion in Bath Island with 14-ft ceilings, exposed brick and steel-framed factory windows. The open plan flows onto a mezzanine study, and the kitchen features honed granite and brass fixtures. Fully furnished with a curated collection of local design pieces.",
    price: 320_000,
    status: "RENT",
    type: "APARTMENT",
    beds: 2,
    baths: 2,
    area: 2100,
    address: "Bath Island, Clifton",
    city: "Karachi",
    district: "Clifton",
    images: [`${V}/loft-1.jpg`, `${V}/apartment-2.jpg`],
    amenities: ["Sea View", "Central AC", "Backup Power", "24/7 Security", "Elevator", "Furnished"],
    featured: true,
    yearBuilt: 2019,
    parking: 2,
    rating: 4.8,
    agentEmail: "fatima@citylineproperty.pk",
  },
  {
    title: "Elegant Family House in Bahria Town",
    slug: "elegant-family-house-bahria-12",
    description:
      "A crisp white 4-bedroom house in Bahria Town Precinct 12 with a front lawn, car porch and a separate maid quarter. Interiors are finished in warm neutrals with a spacious kitchen and dining. The precinct offers parks, a mosque and round-the-clock security patrols.",
    price: 32_000_000,
    status: "SALE",
    type: "HOUSE",
    beds: 4,
    baths: 5,
    area: 2400,
    address: "Precinct 12, Bahria Town",
    city: "Karachi",
    district: "Bahria Town",
    images: [`${V}/house-1.jpg`, `${V}/kitchen-1.jpg`, `${V}/bedroom-1.jpg`],
    amenities: ["Garden", "Covered Parking", "Backup Power", "24/7 Security", "Community Park", "Maid Room"],
    yearBuilt: 2020,
    parking: 2,
    rating: 4.5,
    agentEmail: "ahmed@citylineproperty.pk",
  },
  {
    title: "Private Farmhouse Retreat, Gadap",
    slug: "private-farmhouse-gadap",
    description:
      "A 2-acre weekend retreat off the Super Highway with a 4-bedroom main house, orchard, BBQ pavilion and a spring-fed pool. Fully solar-powered with a deep bore well and staff quarters. Ideal for families seeking green space within an hour of the city.",
    price: 55_000_000,
    status: "SALE",
    type: "FARMHOUSE",
    beds: 4,
    baths: 4,
    area: 87000,
    address: "Gadap Town, Super Highway",
    city: "Karachi",
    district: "Gadap",
    images: [`${V}/villa-1.jpg`, `${V}/bedroom-1.jpg`],
    amenities: ["Swimming Pool", "Solar Panels", "Garden", "Staff Quarters", "Covered Parking", "Bore Well"],
    yearBuilt: 2016,
    parking: 6,
    rating: 4.4,
    agentEmail: "sara@citylineproperty.pk",
  },
  {
    title: "Compact Studio in North Nazimabad",
    slug: "compact-studio-north-nazimabad",
    description:
      "A smartly planned 620 sqft studio for young professionals, minutes from the Hyderi food street. Built-in wardrobes, a kitchenette with breakfast counter and a bay window seating nook. Rent includes building maintenance and water.",
    price: 95_000,
    status: "RENT",
    type: "APARTMENT",
    beds: 1,
    baths: 1,
    area: 620,
    address: "Block H, North Nazimabad",
    city: "Karachi",
    district: "North Nazimabad",
    images: [`${V}/apartment-1.jpg`, `${V}/apartment-2.jpg`],
    amenities: ["Elevator", "Backup Power", "24/7 Security", "Furnished"],
    yearBuilt: 2018,
    parking: 1,
    rating: 4.3,
    agentEmail: "fatima@citylineproperty.pk",
  },
  {
    title: "Executive Residence in KDA Scheme 1",
    slug: "executive-residence-kda-1",
    description:
      "A distinguished 6,000 sqyd-lane residence in KDA Scheme 1 with formal drawing and dining rooms, a wood-panelled study and a serene courtyard fountain. Recently refreshed with heritage-inspired detailing, new services and a 5KVA solar hybrid system.",
    price: 68_000_000,
    status: "SALE",
    type: "HOUSE",
    beds: 5,
    baths: 5,
    area: 3550,
    address: "KDA Scheme 1",
    city: "Karachi",
    district: "Gulshan-e-Iqbal",
    images: [`${V}/townhouse-1.jpg`, `${V}/bedroom-1.jpg`, `${V}/kitchen-1.jpg`],
    amenities: ["Garden", "Central AC", "Covered Parking", "Backup Power", "Solar Panels", "24/7 Security", "Study Room"],
    featured: true,
    yearBuilt: 2014,
    parking: 3,
    rating: 4.7,
    agentEmail: "ahmed@citylineproperty.pk",
  },
  {
    title: "Boutique Office Space on Shahrah-e-Faisal",
    slug: "boutique-office-shahrah-e-faisal",
    description:
      "A 3,400 sqft boutique office with its own entrance on Shahrah-e-Faisal, ideal for design studios, law firms or a regional HQ. Double-height reception, 3 cabins, a 20-person boardroom and client parking at the door. Currently fitted to a high standard and available immediately.",
    price: 95_000_000,
    status: "SALE",
    type: "OFFICE",
    beds: 0,
    baths: 3,
    area: 3400,
    address: "Shahrah-e-Faisal, Block 6 PECHS",
    city: "Karachi",
    district: "PECHS",
    images: [`${V}/loft-1.jpg`, `${V}/office-1.jpg`],
    amenities: ["Central AC", "Backup Power", "24/7 Security", "Covered Parking", "Elevator", "Fibre Internet"],
    yearBuilt: 2012,
    parking: 8,
    rating: 4.4,
    agentEmail: "bilal@citylineproperty.pk",
  },
];

const testimonials = [
  {
    name: "Hina Qureshi",
    role: "Bought a villa in DHA Phase 6",
    content:
      "City Line made our first villa purchase completely painless. Ahmed negotiated hard for us and handled every document — we were keys-in-hand six weeks earlier than expected.",
    rating: 5,
    initials: "HQ",
  },
  {
    name: "Omar Farooq",
    role: "Tenant, Clifton penthouse",
    content:
      "The virtual tour was exactly what arrived, and the lease was transparent down to the last line. Sara's team even arranged the movers. Easily the best rental experience in Karachi.",
    rating: 5,
    initials: "OF",
  },
  {
    name: "Sadia & Kamran Ali",
    role: "Sold in PECHS",
    content:
      "We had three offers above asking within two weeks of listing. The photography alone was worth it — our old house had never looked like that.",
    rating: 5,
    initials: "SA",
  },
  {
    name: "Daniyal Haq",
    role: "CEO, fintech startup",
    content:
      "Bilal found us a fitted floor on I.I. Chundrigar at 12% under our budget and negotiated a rent-free fit-out period. Our office move took eleven days, start to finish.",
    rating: 5,
    initials: "DH",
  },
];

async function main() {
  console.log("Clearing existing data…");
  await db.inquiry.deleteMany();
  await db.property.deleteMany();
  await db.agent.deleteMany();
  await db.testimonial.deleteMany();
  await db.newsletter.deleteMany();

  console.log("Seeding agents…");
  for (const a of agents) {
    await db.agent.create({ data: a });
  }
  const agentRows = await db.agent.findMany();
  const byEmail = new Map(agentRows.map((a) => [a.email, a.id]));

  console.log("Seeding properties…");
  for (const p of properties) {
    const { agentEmail, featured, ...rest } = p;
    await db.property.create({
      data: {
        ...rest,
        featured: featured ?? false,
        images: JSON.stringify(p.images),
        amenities: JSON.stringify(p.amenities),
        views: Math.floor(Math.random() * 900) + 120,
        agentId: byEmail.get(agentEmail)!,
      },
    });
  }

  console.log("Seeding testimonials…");
  for (const t of testimonials) {
    await db.testimonial.create({ data: t });
  }

  const counts = await Promise.all([
    db.property.count(),
    db.agent.count(),
    db.testimonial.count(),
  ]);
  console.log(`Done — ${counts[0]} properties, ${counts[1]} agents, ${counts[2]} testimonials.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
