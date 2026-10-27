import { headers } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";

/**
 * SEO helpers shared by layout.generateMetadata and SeoJsonLd — both need
 * the same per-URL data (original path + the listing it maps to), and
 * React's cache() dedupes the DB query within one server render.
 */

export const SITE = "https://www.citylineproperty.com.pk";

/** Original request path when served through a real-URL rewrite, else null. */
export async function originalPath(): Promise<string | null> {
  try {
    const h = await headers();
    const p = h.get("x-clp-original-path");
    return p && p !== "/" ? p : null;
  } catch {
    return null;
  }
}

/** /property/<id> → id, /properties → "properties", else null. */
export function parseSeoPath(path: string | null): { kind: "property"; id: string } | { kind: "properties" } | null {
  if (!path) return null;
  const m = /^\/property\/([A-Za-z0-9]+)\/?$/.exec(path);
  if (m) return { kind: "property", id: m[1] };
  if (/^\/properties\/?$/.test(path)) return { kind: "properties" };
  return null;
}

export interface SeoProperty {
  id: string;
  title: string;
  price: number;
  status: string;
  type: string;
  description: string;
  beds: number;
  baths: number;
  area: number;
  address: string;
  city: string;
  district: string;
  images: string;
  listingState: string;
  reference: string;
  createdAt: Date;
  updatedAt: Date;
}

/** The published listing for a /property/<id> SEO path (cached per render). */
export const getSeoProperty = cache(
  async (id: string): Promise<SeoProperty | null> => {
    try {
      return await db.property.findFirst({
        where: { id, published: true },
        select: {
          id: true,
          title: true,
          price: true,
          status: true,
          type: true,
          description: true,
          beds: true,
          baths: true,
          area: true,
          address: true,
          city: true,
          district: true,
          images: true,
          listingState: true,
          reference: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch {
      return null;
    }
  }
);

/** Price in exact Crore/Lakh form for titles & descriptions (2 dp, trimmed). */
export function priceLabel(price: number, status: string): string {
  if (status === "RENT") return `PKR ${price.toLocaleString("en-PK")}/month`;
  if (price >= 10_000_000) {
    const v = (price / 10_000_000).toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    return `PKR ${v} Crore`;
  }
  if (price >= 100_000) {
    const v = (price / 100_000).toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
    return `PKR ${v} Lakh`;
  }
  return `PKR ${price.toLocaleString("en-PK")}`;
}

/** Marla label (1 marla = 225 sqft — owner standard). */
export function marlaLabel(sqft: number): string {
  const marla = sqft / 225;
  const text =
    Math.abs(marla - Math.round(marla)) < 0.005
      ? String(Math.round(marla))
      : marla.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  return `${text} Marla`;
}
