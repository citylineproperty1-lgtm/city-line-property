import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const SITE = "https://citylineproperty.vercel.app";

// Render at request time (never at build) — edge-cached 1h via next.config.
export const dynamic = "force-dynamic";

/**
 * The public site is a hash-routed SPA, so "/" is the one canonical,
 * indexable URL. Google renders the JS and sees every view through it.
 *
 * lastmod is derived from the database (newest published listing) so it is
 * ACCURATE — it only changes when the content actually changes. Google
 * learns to distrust sitemap lastmod values that always say "now".
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let lastModified = new Date();
  try {
    const latest = await db.property.findFirst({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      select: { updatedAt: true },
    });
    if (latest?.updatedAt) lastModified = latest.updatedAt;
  } catch {
    // Database unavailable — fall back to "now" rather than failing the route.
  }

  return [
    {
      url: `${SITE}/`,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
