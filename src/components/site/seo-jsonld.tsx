import { db } from "@/lib/db";
import { FAQS } from "@/lib/faq";
import { originalPath, parseSeoPath, getSeoProperty, priceLabel, marlaLabel, SITE } from "@/lib/seo-path";

const AREAS = [
  "Etihad Town Phase 1",
  "Etihad Town Phase 2",
  "Royal Enclave",
  "Premier Enclave",
  "Overseas Block",
];

function firstImage(images: string): string | undefined {
  try {
    const arr = JSON.parse(images) as string[];
    const p = Array.isArray(arr) ? arr[0] : undefined;
    if (!p) return undefined;
    if (p.startsWith("http")) return p;
    return `${SITE}${p.startsWith("/") ? "" : "/"}${p}`;
  } catch {
    return undefined;
  }
}

function allImages(images: string): string[] | undefined {
  try {
    const arr = JSON.parse(images) as string[];
    if (!Array.isArray(arr) || arr.length === 0) return undefined;
    return arr.slice(0, 10).map((p) =>
      p.startsWith("http") ? p : `${SITE}${p.startsWith("/") ? "" : "/"}${p}`
    );
  } catch {
    return undefined;
  }
}

function shortDescription(text: string): string | undefined {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return undefined;
  return flat.length > 180 ? `${flat.slice(0, 177)}...` : flat;
}

// ISO date ~1 year out — Merchant listings like a price validity window.
function priceValidUntil(): string {
  return new Date(Date.now() + 365 * 86400_000).toISOString().slice(0, 10);
}

/** The local-business entity, shared by every page (stable @id for Google's
 *  entity graph — GEO: consistent entity across all URLs). */
function agentNode() {
  return {
    "@type": "RealEstateAgent",
    "@id": `${SITE}/#organization`,
    name: "City Line Property",
    url: SITE,
    image: `${SITE}/logo.png`,
    logo: `${SITE}/logo.png`,
    telephone: "+92 309 4499940",
    priceRange: "PKR",
    address: {
      "@type": "PostalAddress",
      streetAddress: "151-C Etihad Town Phase 1",
      addressLocality: "Lahore",
      addressRegion: "Punjab",
      postalCode: "54000",
      addressCountry: "PK",
    },
    geo: { "@type": "GeoCoordinates", latitude: 31.4314, longitude: 74.2519 },
    areaServed: AREAS.map((a) => ({ "@type": "Place", name: a })),
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "10:00",
        closes: "20:00",
      },
    ],
    sameAs: ["https://wa.me/923094499940"],
  };
}

/**
 * Structured data (schema.org JSON-LD), server-rendered:
 *  - /property/<id> → the listing itself (Product + Offer, BreadcrumbList)
 *    alongside the agency entity — indexed against its REAL URL.
 *  - everywhere else → RealEstateAgent + WebSite + FAQPage + featured
 *    listings ItemList.
 * Never throws — if the database is unavailable, listings are simply omitted.
 */
export async function SeoJsonLd() {
  const path = await originalPath();
  const target = parseSeoPath(path);

  // ---- per-listing page ----
  if (target?.kind === "property") {
    const p = await getSeoProperty(target.id);
    if (p) {
      const url = `${SITE}/property/${p.id}`;
      const imgs = allImages(p.images);
      const desc = shortDescription(p.description);
      const product = {
        "@type": "Product",
        "@id": `${url}#listing`,
        name: p.title,
        url,
        ...(desc ? { description: desc } : {}),
        sku: p.reference,
        mpn: p.reference,
        brand: { "@type": "Brand", name: "City Line Property" },
        ...(imgs ? { image: imgs } : {}),
        category: p.type,
        additionalProperty: [
          { "@type": "PropertyValue", name: "Bedrooms", value: String(p.beds) },
          { "@type": "PropertyValue", name: "Bathrooms", value: String(p.baths) },
          { "@type": "PropertyValue", name: "Area", value: String(p.area), unitText: "sqft" },
          { "@type": "PropertyValue", name: "Area (Marla)", value: marlaLabel(p.area) },
          { "@type": "PropertyValue", name: "Location", value: `${p.district}, ${p.city}` },
          { "@type": "PropertyValue", name: "Reference", value: p.reference },
        ],
        offers: {
          "@type": "Offer",
          url,
          price: p.price,
          priceCurrency: "PKR",
          priceValidUntil: priceValidUntil(),
          itemCondition: "https://schema.org/NewCondition",
          availability:
            p.listingState === "AVAILABLE"
              ? "https://schema.org/InStock"
              : "https://schema.org/SoldOut",
          seller: { "@id": `${SITE}/#organization` },
        },
      };
      const graph = [
        agentNode(),
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: SITE },
            { "@type": "ListItem", position: 2, name: "Listings", item: `${SITE}/properties` },
            { "@type": "ListItem", position: 3, name: p.title, item: url },
          ],
        },
        product,
      ];
      return (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }}
        />
      );
    }
  }

  // ---- shared (home + listings index + everything else) ----
  let items: object[] = [];
  try {
    const rows = await db.property.findMany({
      where: { featured: true, published: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        title: true,
        price: true,
        images: true,
        listingState: true,
        reference: true,
        description: true,
        beds: true,
        baths: true,
        area: true,
        district: true,
        city: true,
      },
    });
    items = rows.map((p, i) => {
      const img = firstImage(p.images);
      const desc = shortDescription(p.description);
      const productUrl = `${SITE}/property/${p.id}`;
      return {
        "@type": "ListItem",
        position: i + 1,
        url: productUrl,
        item: {
          "@type": "Product",
          name: p.title,
          url: productUrl,
          ...(desc ? { description: desc } : {}),
          // Reference code (CLP-101…) doubles as the SKU Google asks for
          sku: p.reference,
          brand: { "@type": "Brand", name: "City Line Property" },
          ...(img ? { image: img } : {}),
          additionalProperty: [
            { "@type": "PropertyValue", name: "Bedrooms", value: String(p.beds) },
            { "@type": "PropertyValue", name: "Bathrooms", value: String(p.baths) },
            { "@type": "PropertyValue", name: "Area", value: String(p.area), unitText: "sqft" },
            { "@type": "PropertyValue", name: "Location", value: `${p.district}, ${p.city}` },
          ],
          offers: {
            "@type": "Offer",
            price: p.price,
            priceCurrency: "PKR",
            url: productUrl,
            priceValidUntil: priceValidUntil(),
            availability:
              p.listingState === "AVAILABLE"
                ? "https://schema.org/InStock"
                : "https://schema.org/SoldOut",
          },
        },
      };
    });
  } catch {
    items = [];
  }

  const graph = [
    agentNode(),
    {
      "@type": "WebSite",
      "@id": `${SITE}/#website`,
      name: "City Line Property",
      alternateName: ["Cityline Property", "City Line Property Lahore"],
      url: SITE,
      publisher: { "@id": `${SITE}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE}/properties?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "FAQPage",
      name: "City Line Property — Frequently Asked Questions",
      mainEntity: FAQS.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    ...(items.length
      ? [
          {
            "@type": "ItemList",
            name: "Featured Properties — City Line Property",
            numberOfItems: items.length,
            itemListElement: items,
          },
        ]
      : []),
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}
