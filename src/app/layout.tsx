import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { SeoJsonLd } from "@/components/site/seo-jsonld";
import { SeoContent } from "@/components/site/seo-content";
import { SeoGate } from "@/components/site/seo-gate";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// The root layout renders live SEO data from the database (JSON-LD +
// crawlable homepage content). Keep this segment dynamic so builds never
// touch the database and every request serves fresh data.
export const dynamic = "force-dynamic";

const SITE = "https://citylineproperty.vercel.app";

const TITLE =
  "City Line Property — Real Estate in Etihad Town, Lahore | 1% Commission";
const DESCRIPTION =
  "Buy, sell & rent property in Etihad Town, Lahore — plots, houses & apartments in Phase 1 & 2, Royal Enclave, Premier Enclave & Overseas Block. Only 1% commission.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: TITLE, template: "%s | City Line Property" },
  description: DESCRIPTION,
  keywords: [
    "City Line Property",
    "city line property lahore",
    "Etihad Town Phase 1",
    "Etihad Town Phase 2",
    "property in Etihad Town",
    "Royal Enclave Lahore",
    "Premier Enclave Lahore",
    "Overseas Block Lahore",
    "1% commission property Lahore",
    "1 percent commission property dealer",
    "plots for sale Etihad Town",
    "houses for sale Lahore",
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
        url: "/opengraph-image",
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
    images: ["/opengraph-image"],
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
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/logo.png", type: "image/png" },
    ],
    apple: [{ url: "/logo.png" }],
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0F766E",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-background text-foreground`}>
        {children}
        {/* Server-rendered, crawlable homepage content (auto-hidden on other hash views) */}
        <SeoGate>
          <SeoContent />
        </SeoGate>
        {/* Structured data: RealEstateAgent + WebSite + featured listings */}
        <SeoJsonLd />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
