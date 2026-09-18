/**
 * City Line Property — official business information (client-safe constants).
 * This is the single source of truth for contact details shown on the site.
 */

export const BUSINESS = {
  name: "City Line Property",
  tagline: "Your Key to the City",
  taglineUpper: "YOUR KEY TO THE CITY",
  kind: "Real Estate Office · Property Dealer",
  // Headline selling point
  commissionLine: "Only 1% Commission",
  commissionNote: "Direct dealing — no hidden margin, no middlemen",
  officeAddress: "151-C, Etihad Town Phase 1, Lahore",
  phonePrimary: "0309 4499940",
  phoneSecondary: "0321 8422109",
  email: "citylineproperty1@gmail.com",
  hours: "Mon–Sat · 9:00 AM – 7:00 PM",
  // International format for wa.me / tel: links
  whatsappNumber: "923094499940",
  whatsappNumber2: "923218422109",
  telPrimary: "+923094499940",
  telSecondary: "+923218422109",
} as const;

/** The only 5 areas we deal in (final list — Phase 3/4 intentionally excluded). */
export const AREAS = [
  "Etihad Town Phase 1",
  "Etihad Town Phase 2",
  "Royal Enclave",
  "Premier Enclave",
  "Overseas Block",
] as const;

export type AreaName = (typeof AREAS)[number];

export const CITY = "Lahore";

/** Build a wa.me deep link with a prefilled message (opens the visitor's own WhatsApp). */
export function waLink(message: string, phone: string = BUSINESS.whatsappNumber): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function telLink(phone: string = BUSINESS.telPrimary): string {
  return `tel:${phone}`;
}

/** Map-side short labels for the 5 areas. */
export const AREA_SHORT: Record<string, string> = {
  "Etihad Town Phase 1": "Phase 1",
  "Etihad Town Phase 2": "Phase 2",
  "Royal Enclave": "Royal Enclave",
  "Premier Enclave": "Premier Enclave",
  "Overseas Block": "Overseas B.",
};
