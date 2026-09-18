/**
 * Shared types for City Line Property.
 * Categories are admin-managed (Category table); this file ships a fallback
 * list so the UI renders instantly even before the categories API responds.
 */
import type { AreaName } from "./business";

export type PropertyStatus = "SALE" | "RENT";

// AVAILABLE | RESERVED | SOLD | RENTED
export type ListingState = "AVAILABLE" | "RESERVED" | "SOLD" | "RENTED";

export type PropertyType =
  | "residential-plots"
  | "commercial-plots"
  | "houses"
  | "apartments"
  | "commercial-halls"
  | "flat-studio"
  | "for-rent"
  | string;

export interface Agent {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  initials: string;
  accent: string;
  bio: string;
}

export interface Property {
  id: string;
  title: string;
  slug: string;
  reference: string;
  description: string;
  price: number;
  status: PropertyStatus;
  type: PropertyType;
  beds: number;
  baths: number;
  area: number;
  address: string;
  city: string;
  district: string;
  images: string[];
  amenities: string[];
  featured: boolean;
  listingState: ListingState;
  published: boolean;
  yearBuilt: number;
  parking: number;
  views: number;
  rating: number;
  agent: Agent;
  createdAt: string;
}

export interface CategoryDef {
  slug: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

/** Fallback category list (mirrors the DB seed). Admin can manage these in the panel. */
export const CATEGORIES: CategoryDef[] = [
  { slug: "residential-plots", name: "Residential Plots", icon: "LandPlot", color: "#34C759", description: "3 Marla to 1 Kanal residential plots in every block" },
  { slug: "commercial-plots", name: "Commercial Plots", icon: "Store", color: "#FF9500", description: "Main-boulevard commercial plots with high footfall" },
  { slug: "houses", name: "Houses", icon: "Home", color: "#A2845E", description: "Brand-new and pre-owned houses, ready to move" },
  { slug: "apartments", name: "Apartments", icon: "Building2", color: "#30B0C7", description: "Modern apartments with premium amenities" },
  { slug: "commercial-halls", name: "Commercial Halls", icon: "Warehouse", color: "#AF52DE", description: "Halls and warehouses for business & investment" },
  { slug: "flat-studio", name: "Flat / Studio", icon: "BedDouble", color: "#FF2D55", description: "Compact flats and studios, ideal first investment" },
  { slug: "for-rent", name: "For Rent", icon: "KeyRound", color: "#007AFF", description: "Houses, apartments and halls available on rent" },
];

/** slug → display label (also understands legacy uppercase types). */
export const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c.name])
);

export function categoryLabel(type: string): string {
  if (CATEGORY_LABELS[type]) return CATEGORY_LABELS[type];
  if (TYPE_LABELS_LEGACY[type]) return TYPE_LABELS_LEGACY[type];
  return type.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

const TYPE_LABELS_LEGACY: Record<string, string> = {
  HOUSE: "House",
  APARTMENT: "Apartment",
  VILLA: "Villa",
  PENTHOUSE: "Penthouse",
  TOWNHOUSE: "Townhouse",
  OFFICE: "Office",
  FARMHOUSE: "Farmhouse",
};

/** Back-compat alias used by older components. */
export const TYPE_LABELS = TYPE_LABELS_LEGACY;

/** Back-compat list for older filter UIs (slug-based). */
export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = CATEGORIES.map(
  (c) => ({ value: c.slug, label: c.name })
);

export interface PropertyQuery {
  search?: string;
  status?: string;
  type?: string;
  beds?: number;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  district?: string;
  sort?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
  ids?: string;
  agentId?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  category: string | null;
  area: string | null;
  budget: number | null;
  message: string;
  propertyId: string | null;
  property?: { id: string; title: string } | null;
  source: string;
  status: string;
  notes: string | null;
  waStatus: string;
  waSentAt: string | null;
  waError: string | null;
  createdAt: string;
}

export interface LeadInput {
  name: string;
  phone: string;
  email?: string;
  category?: string;
  area?: string;
  budget?: number;
  message: string;
  propertyId?: string;
  source?: string;
}

export interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  content: string;
  rating: number;
  initials: string;
}

export interface PlatformStats {
  properties: number;
  forSale: number;
  forRent: number;
  cities: number;
  districts: number;
  leads: number;
  agents: number;
}

export const LEAD_STATUSES = ["NEW", "CONTACTED", "SITE_VISIT", "NEGOTIATION", "WON", "LOST"] as const;

export const LISTING_STATES = ["AVAILABLE", "RESERVED", "SOLD", "RENTED"] as const;
