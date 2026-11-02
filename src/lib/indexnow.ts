import { SITE } from "@/lib/seo-path";

/**
 * IndexNow (indexnow.org) — instant URL submission to Bing, Yandex, Seznam &
 * Naver whenever a listing is created or updated. Google is NOT part of
 * IndexNow (it crawls the sitemap on its own schedule).
 *
 * The key is public by design: it only proves we control the site, because
 * the same key must be readable at /<key>.txt (see public/).
 * Responses: 200/202 accepted · 400 bad request · 403 key file missing
 * · 422 URLs don't belong to the host · 429 too many requests.
 *
 * NOTE: the shared api.indexnow.org endpoint rejects our POST bodies with
 * 400 (verified 2026-10-30 across every documented body shape) while the
 * simple GET form returns 202 — so we submit per-URL via GET with a small
 * delay between calls.
 */

export const INDEXNOW_KEY = "7f507333efe1f10a6e821667d6e7cbd8";

const ENDPOINT = "https://api.indexnow.org/indexnow";

/**
 * Fire-and-forget ping — NEVER throws, never blocks longer than ~6s, and
 * silently no-ops outside production (dev runs don't need Bing).
 * Returns the number of URLs the engine accepted.
 */
export async function pingIndexNow(urls: string[]): Promise<number> {
  try {
    if (process.env.VERCEL_ENV !== "production") return 0;
    const clean = [...new Set(urls.filter((u) => u.startsWith(SITE)))].slice(0, 10);
    if (!clean.length) return 0;
    let accepted = 0;
    for (let i = 0; i < clean.length; i++) {
      try {
        const res = await fetch(
          `${ENDPOINT}?url=${encodeURIComponent(clean[i])}&key=${INDEXNOW_KEY}&keyLocation=${encodeURIComponent(`${SITE}/${INDEXNOW_KEY}.txt`)}`,
          { signal: AbortSignal.timeout(5000), cache: "no-store" }
        );
        if (res.ok) accepted++;
        else console.warn(`IndexNow ping ${res.status} for ${clean[i]}`);
      } catch (e) {
        console.warn("IndexNow ping failed (ignored)", e instanceof Error ? e.message : e);
      }
      if (i < clean.length - 1) await new Promise((r) => setTimeout(r, 250));
    }
    if (accepted) console.log(`IndexNow accepted ${accepted}/${clean.length} URL(s)`);
    return accepted;
  } catch (e) {
    console.warn("IndexNow ping error (ignored)", e instanceof Error ? e.message : e);
    return 0;
  }
}

/**
 * Ping one listing plus the pages that list it (home + inventory index).
 * Called after an admin creates or updates a PUBLISHED listing.
 */
export async function pingListingUrls(listingId: string): Promise<number> {
  return pingIndexNow([
    `${SITE}/property/${listingId}`,
    `${SITE}/`,
    `${SITE}/properties`,
  ]);
}
