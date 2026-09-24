import type { MetadataRoute } from "next";

const SITE = "https://citylineproperty.vercel.app";

/**
 * The public site is a hash-routed SPA, so "/" is the one canonical,
 * indexable URL. Google renders the JS and sees every view through it.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${SITE}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
