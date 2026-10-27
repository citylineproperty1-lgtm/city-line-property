import type { MetadataRoute } from "next";
import { db } from "@/lib/db";

const SITE = "https://www.citylineproperty.com.pk";

// Render at request time (never at build) — edge-cached 1h via next.config.
export const dynamic = "force-dynamic";

/**
 * Real, crawlable URLs for every published listing (/property/<id>) plus the
 * listings index (/properties). The client SPA serves them via next.config
 * rewrites — see src/middleware.ts + src/lib/store.ts.
 *
 * lastmod is derived from the database (per listing + newest overall) so it
 * is ACCURATE — it only changes when the content actually changes. Google
 * learns to distrust sitemap lastmod values that always say "now".
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const rows = await db.property.findMany({
      where: { published: true },
      orderBy: { updatedAt: "desc" },
      select: { id: true, updatedAt: true },
    });

    const newest = rows[0]?.updatedAt ?? new Date();

    return [
      {
        url: `${SITE}/`,
        lastModified: newest,
        changeFrequency: "daily",
        priority: 1,
      },
      {
        url: `${SITE}/properties`,
        lastModified: newest,
        changeFrequency: "daily",
        priority: 0.9,
      },
      ...rows.map((r) => ({
        url: `${SITE}/property/${r.id}`,
        lastModified: r.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // Database unavailable — at least the homepage, rather than failing.
    return [
      {
        url: `${SITE}/`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1,
      },
    ];
  }
}
