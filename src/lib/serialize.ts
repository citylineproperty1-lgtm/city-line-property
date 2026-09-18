import type { Property as DbProperty } from "@prisma/client";
import type { Property } from "./types";

export function serializeProperty(p: DbProperty): Property {
  return {
    id: p.id,
    title: p.title,
    slug: p.slug,
    reference: p.reference,
    description: p.description,
    price: p.price,
    status: p.status as Property["status"],
    type: p.type,
    beds: p.beds,
    baths: p.baths,
    area: p.area,
    address: p.address,
    city: p.city,
    district: p.district,
    images: JSON.parse(p.images),
    amenities: JSON.parse(p.amenities),
    featured: p.featured,
    listingState: p.listingState as Property["listingState"],
    published: p.published,
    yearBuilt: p.yearBuilt,
    parking: p.parking,
    views: p.views,
    createdAt: p.createdAt.toISOString(),
  };
}
