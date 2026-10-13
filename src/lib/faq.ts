/**
 * Customer FAQ — single source of truth.
 * Rendered visibly on the homepage (seo-content.tsx, accordion) AND emitted as
 * FAQPage JSON-LD (seo-jsonld.tsx). Google requires the marked-up questions to
 * be visible on the page, so both sides must always render the same content.
 * Wording is intentionally keyword-rich: property dealer Etihad Town, 1%
 * commission, plots/houses/apartments Lahore, Raiwind Road.
 */

export type Faq = { q: string; a: string };

export const FAQS: Faq[] = [
  {
    q: "Where is City Line Property located?",
    a: "Our office is at 151-C Etihad Town Phase 1, Raiwind Road, Lahore, Punjab, Pakistan. We are open every day from 10:00 AM to 8:00 PM — walk in any time.",
  },
  {
    q: "What commission does City Line Property charge?",
    a: "Only 1% commission on every deal — buying, selling or renting. We deal directly between buyer and seller, so there are no middlemen and no hidden margin.",
  },
  {
    q: "Which areas does City Line Property cover?",
    a: "Etihad Town Phase 1, Etihad Town Phase 2, Royal Enclave, Premier Enclave, Overseas Block and nearby societies on Raiwind Road, Lahore.",
  },
  {
    q: "What types of property can I buy, sell or rent?",
    a: "Residential plots, commercial plots, houses, apartments and commercial property. Every listing on our website is verified by our team before it is published.",
  },
  {
    q: "How do I contact City Line Property?",
    a: "Call or WhatsApp 0309 4499940 or 0321 8422109, browse listings at www.citylineproperty.com.pk, or visit the office at 151-C Etihad Town Phase 1, Lahore — open daily 10 AM to 8 PM.",
  },
];
