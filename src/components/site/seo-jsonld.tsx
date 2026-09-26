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
      select: { id: true, title: true, price: true, images: true, listingState: true },
    });
    items = rows.map((p, i) => {
      const img = firstImage(p.images);
      return {
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Product",
          name: p.title,
          url: `${SITE}/#/property/${p.id}`,
          ...(img ? { image: img } : {}),
          offers: {
            "@type": "Offer",
            price: p.price,
            priceCurrency: "PKR",
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
