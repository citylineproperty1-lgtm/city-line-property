/**
 * Google Analytics 4 event helper (client-side only).
 *
 * Safe no-op until the gtag script (loaded in app/layout.tsx) is ready:
 * the inline loader defines window.gtag immediately, so any event pushed
 * BEFORE the gtag.js file arrives is queued in dataLayer automatically.
 */

type EventParams = Record<string, string | number | boolean | undefined>;

export function trackEvent(name: string, params?: EventParams): void {
  try {
    const g = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
    if (typeof g === "function") {
      g("event", name, params ?? {});
    }
  } catch {
    /* analytics must never break a click */
  }
}

/** Pre-baked events for the contact actions the owner cares about. */
export const trackWhatsAppClick = (where: string) =>
  trackEvent("whatsapp_click", { location: where });

export const trackCallClick = (where: string) =>
  trackEvent("call_click", { location: where });
