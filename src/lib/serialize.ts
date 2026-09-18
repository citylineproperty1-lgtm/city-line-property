import type { Agent as DbAgent, Property as DbProperty } from "@prisma/client";
import type { Property, Agent } from "./types";

type PropertyWithAgent = DbProperty & { agent: DbAgent };

export function serializeAgent(a: DbAgent): Agent {
  return {
    id: a.id,
    name: a.name,
    title: a.title,
    email: a.email,
    phone: a.phone,
    initials: a.initials,
    accent: a.accent,
    bio: a.bio,
  };
}

export function serializeProperty(p: PropertyWithAgent): Property {
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
    rating: p.rating,
    agent: serializeAgent(p.agent),
    createdAt: p.createdAt.toISOString(),
  };
}
