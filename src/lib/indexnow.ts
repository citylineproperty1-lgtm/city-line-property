import { SITE } from "@/lib/seo-path";

/**
 * IndexNow (indexnow.org) — instant URL submission to Bing, Yandex, Seznam &
 * Naver whenever a listing is created or updated. Google is NOT part of
 * IndexNow (it crawls the sitemap on its own schedule).
 *
 * The key is public by design: it only proves we control the site, because
 * the same key must be readable at /<key>.txt (see public/).
 * Responses: 200/202 accepted · 400 bad key/request · 403 key file missing
 * · 422 URLs don't belong to the host · 429 too many requests.
 */

export const INDEXNOW_KEY = "7f507333efe1f10a6e821667d6e7cbd8";

const ENDPOINT = "https://api.indexnow.org/IndexNow.json";

/**
 * Fire-and-forget ping — NEVER throws, never blocks longer than 5s, and
 * silently no-ops outside production (dev runs don't need Bing).
 * Returns true when the engine accepted the submission.
 */
export async function pingIndexNow(urls: string[]): Promise<boolean> {
  try {
    if (process.env.VERCEL_ENV !== "production") return false;
    const clean = [...new Set(urls.filter((u) => u.startsWith(SITE)))].slice(0, 100);
    if (!clean.length) return false;
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: "www.citylineproperty.com.pk",
        key: INDEXNOW_KEY,
        keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
        urlList: clean,
      }),
      signal: AbortSignal.timeout(5000),
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`IndexNow ping ${res.status} for ${clean.length} URL(s)`);
      return false;
    }
    console.log(`IndexNow pinged: ${clean.length} URL(s)`);
    return true;
  } catch (e) {
    console.warn("IndexNow ping failed (ignored)", e instanceof Error ? e.message : e);
    return false;
  }
}

/**
 * Ping one listing plus the pages that list it (home + inventory index).
 * Called after an admin creates or updates a PUBLISHED listing.
 */
export async function pingListingUrls(listingId: string): Promise<boolean> {
  return pingIndexNow([
    `${SITE}/property/${listingId}`,
    `${SITE}/`,
    `${SITE}/properties`,
  ]);
}
