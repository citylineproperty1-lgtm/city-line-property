import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SeoJsonLd } from "@/components/site/seo-jsonld";
import { SeoContent } from "@/components/site/seo-content";
import { SeoGate } from "@/components/site/seo-gate";
import { ThemeProvider } from "@/components/site/theme-provider";
import { originalPath, parseSeoPath, getSeoProperty, priceLabel, marlaLabel, SITE } from "@/lib/seo-path";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// The root layout renders live SEO data from the database (JSON-LD +
// crawlable content). Real-URL rewrites (/property/<id>, /properties) need
// PER-URL titles, descriptions, canonicals and JSON-LD, so metadata is
// resolved per request via generateMetadata + middleware's x-clp-original-path
// header. Rendering is dynamic, but next.config's edge Cache-Control for "/"
// (s-maxage=60 + stale-while-revalidate) keeps TTFB healthy. Visitor/admin
// data itself always flows through uncached /api routes, so nothing the user
// sees is ever stale.
export const dynamic = "force-dynamic";

/** Google Analytics 4 — owner's web stream (Measurement ID). */
const GA4_ID = "G-1JLS4S6NSX";

const TITLE =
  "Property & Real Estate in Etihad Town, Lahore — City Line Property | 1% Commission";
const DESCRIPTION =
  "Trusted property dealer in Etihad Town, Lahore — buy, sell or rent plots, houses & apartments in Phase 1 & 2, Royal Enclave, Premier Enclave & Overseas Block. Only 1% commission.";

const defaultMetadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: TITLE, template: "%s | City Line Property" },
  description: DESCRIPTION,
  keywords: [
    "City Line Property",
    "Cityline Property",
    "cityline property lahore",
    "property in Lahore",
    "property dealer in Lahore",
    "property dealer in Etihad Town",
    "property for sale in Etihad Town",
    "Etihad Town Phase 1",
    "Etihad Town Phase 2",
    "property in Etihad Town",
    "Royal Enclave Lahore",
    "Premier Enclave Lahore",
    "Overseas Block Lahore",
    "1% commission property Lahore",
    "1 percent commission property dealer",
    "plots for sale Etihad Town",
    "plots for sale in Etihad Town Phase 1",
    "houses for sale Lahore",
    "houses for sale Etihad Town",
    "houses for rent Etihad Town",
    "apartments for rent Lahore",
    "commercial property Etihad Town",
    "property dealer Raiwind Road Lahore",
    "real estate agency Lahore",
  ],
  applicationName: "City Line Property",
  category: "Real Estate",
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE,
    siteName: "City Line Property",
    locale: "en_PK",
    type: "website",
    images: [
      {
        // Branded 1200×630 card, baked once from the former dynamic generator
        // (public/og-default.png). Static file = no per-request render, and
        // the file-convention override is gone so listing pages can use
        // their own photo as og:image.
        url: "/og-default.png",
        width: 1200,
        height: 630,
        alt: "City Line Property — real estate agency in Etihad Town, Lahore. Only 1% commission.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og-default.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: [{ url: "/logo.png", type: "image/png" }, { url: "/logo-mark.png", type: "image/png" }],
    apple: [{ url: "/logo.png" }],
  },
  manifest: "/manifest.webmanifest",
};

const PROPERTIES_TITLE =
  "Plots, Houses & Apartments for Sale & Rent in Etihad Town, Lahore — City Line Property";
const PROPERTIES_DESCRIPTION =
  "Browse all verified plots, houses, apartments & commercial property for sale and rent in Etihad Town Phase 1 & 2, Royal Enclave, Premier Enclave & Overseas Block, Lahore. Only 1% commission — call 0309 4499940.";

/**
 * Per-URL metadata, resolved server-side (no JS needed):
 *  - /property/<id> → the listing's title, price/area description, canonical
 *    URL and listing-photo OpenGraph image (WhatsApp/IM share previews).
 *  - /properties → the listings index.
 *  - anything else → the site default.
 * Never throws — on any failure the default metadata is returned.
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const path = await originalPath();
    const target = parseSeoPath(path);
    if (target?.kind === "property") {
      const p = await getSeoProperty(target.id);
      if (p) {
        const url = `${SITE}/property/${p.id}`;
        const price = priceLabel(p.price, p.status);
        const area = `${p.area.toLocaleString("en-PK")} sqft (${marlaLabel(p.area)})`;
        const loc = [p.district, p.city].filter(Boolean).join(", ");
        const short = p.description.replace(/\s+/g, " ").trim().slice(0, 140);
        const description = `${price} · ${area} · ${loc}. ${short}`;
        const firstImage = (() => {
          try {
            const arr = JSON.parse(p.images) as string[];
            const img = Array.isArray(arr) ? arr[0] : undefined;
            if (!img) return undefined;
            return img.startsWith("http") ? img : `${SITE}${img.startsWith("/") ? "" : "/"}${img}`;
          } catch {
            return undefined;
          }
        })();
        return {
          ...defaultMetadata,
          title: p.title,
          description,
          alternates: { canonical: `/property/${p.id}` },
          openGraph: {
            ...defaultMetadata.openGraph,
            title: `${p.title} — ${price}`,
            description,
            url,
            type: "website",
            ...(firstImage ? { images: [{ url: firstImage, alt: p.title }] } : {}),
          },
          twitter: {
            card: "summary_large_image",
            title: p.title,
            description,
            ...(firstImage ? { images: [firstImage] } : {}),
          },
        };
      }
      // Unknown/unpublished listing id — keep crawlers out of a dead end.
      return { ...defaultMetadata, robots: { index: false, follow: true } };
    }
    if (target?.kind === "properties") {
      return {
        ...defaultMetadata,
        title: PROPERTIES_TITLE,
        description: PROPERTIES_DESCRIPTION,
        alternates: { canonical: "/properties" },
        openGraph: { ...defaultMetadata.openGraph, title: PROPERTIES_TITLE, description: PROPERTIES_DESCRIPTION, url: `${SITE}/properties` },
      };
    }
  } catch {
    // fall through to the site default
  }
  return defaultMetadata;
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Adaptive browser chrome: follows the visitor's scheme until they pick a
  // theme explicitly (next-themes then drives <html class="dark">).
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f0e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
        {/* Server-rendered, crawlable homepage content (auto-hidden on other hash views) */}
        <SeoGate>
          <SeoContent />
        </SeoGate>
        {/* Structured data: RealEstateAgent + WebSite + featured listings */}
        <SeoJsonLd />
        {/* Google Analytics 4 (G-1JLS4S6NSX) — afterInteractive keeps Lighthouse green */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA4_ID}');
          `}
        </Script>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
