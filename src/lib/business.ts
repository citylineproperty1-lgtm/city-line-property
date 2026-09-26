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
  hours: "Mon–Sun · 10:00 AM – 8:00 PM",
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

/**
 * Real coordinates (WGS-84) around the society on Raiwind Road, Lahore —
 * verified via OpenStreetMap reference points (Hasanabad, Barkatpura, Rahimabad
 * place nodes) mapped against the owner's on-site position mark.
 * OFFICE_COORD is the exact office spot at 151-C, Etihad Town Phase 1
 * (inside the Phase 1 street grid, west of Main Raiwind Road).
 */
export const OFFICE_COORD = { lat: 31.447515, lng: 74.231873 } as const;

export const AREA_COORDS: Record<string, { lat: number; lng: number }> = {
  "Etihad Town Phase 1": { lat: 31.445412, lng: 74.229684 },
  "Etihad Town Phase 2": { lat: 31.4295, lng: 74.2245 },
  "Royal Enclave": { lat: 31.4462, lng: 74.2262 },
  "Premier Enclave": { lat: 31.4372, lng: 74.2383 },
  "Overseas Block": { lat: 31.4341, lng: 74.2312 },
};

/** Google Maps directions URL for the office (opens the real map app). */
export function officeDirectionsLink(): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${OFFICE_COORD.lat},${OFFICE_COORD.lng}`;
}

