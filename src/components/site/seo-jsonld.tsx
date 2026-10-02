import { db } from "@/lib/db";

const SITE = "https://citylineproperty.vercel.app";

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

function shortDescription(text: string): string | undefined {
  const flat = text.replace(/\s+/g, " ").trim();
  if (!flat) return undefined;
  return flat.length > 180 ? `${flat.slice(0, 177)}...` : flat;
}

// ISO date ~1 year out — Merchant listings like a price validity window.
function priceValidUntil(): string {
  return new Date(Date.now() + 365 * 86400_000).toISOString().slice(0, 10);
}

/**
 * Structured data (schema.org JSON-LD), rendered server-side on "/":
 * RealEstateAgent (local business) + WebSite + featured listings ItemList.
 * Never throws — if the database is unavailable, listings are simply omitted.
 */
export async function SeoJsonLd() {
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
      const productUrl = `${SITE}/#/property/${p.id}`;
      return {
        "@type": "ListItem",
        position: i + 1,
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
    {
      "@type": "RealEstateAgent",
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
    },
    {
      "@type": "WebSite",
      name: "City Line Property",
      alternateName: "City Line Property Lahore",
      url: SITE,
    },
    ...(items.length
      ? [
          {
            "@type": "ItemList",
            name: "Featured Properties — City Line Property",
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
