export type PropertyStatus = "SALE" | "RENT";

export type PropertyType =
  | "HOUSE"
  | "APARTMENT"
  | "VILLA"
  | "PENTHOUSE"
  | "TOWNHOUSE"
  | "OFFICE"
  | "FARMHOUSE";

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
  yearBuilt: number;
  parking: number;
  views: number;
  rating: number;
  agent: Agent;
  createdAt: string;
}

export interface PropertyQuery {
  search?: string;
  status?: string;
  type?: string;
  beds?: number;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  sort?: string;
  featured?: boolean;
  limit?: number;
  ids?: string;
}

export interface InquiryInput {
  name: string;
  email: string;
  phone?: string;
  kind?: string;
  message: string;
  propertyId?: string;
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
  inquiries: number;
  agents: number;
}

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "HOUSE", label: "House" },
  { value: "APARTMENT", label: "Apartment" },
  { value: "VILLA", label: "Villa" },
  { value: "PENTHOUSE", label: "Penthouse" },
  { value: "TOWNHOUSE", label: "Townhouse" },
  { value: "OFFICE", label: "Office" },
  { value: "FARMHOUSE", label: "Farmhouse" },
];

export const TYPE_LABELS: Record<string, string> = {
  HOUSE: "House",
  APARTMENT: "Apartment",
  VILLA: "Villa",
  PENTHOUSE: "Penthouse",
  TOWNHOUSE: "Townhouse",
  OFFICE: "Office",
  FARMHOUSE: "Farmhouse",
};
