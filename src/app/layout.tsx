import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "City Line Property — Your Key to the City | Etihad Town, Lahore",
  description:
    "City Line Property is a real estate office in Etihad Town, Lahore — only 1% commission, direct dealing, no hidden margin, no middlemen. Buy and rent plots, houses and apartments in Etihad Town Phase 1 & 2, Royal Enclave, Premier Enclave and Overseas Block. Call 0309 4499940.",
  keywords: [
    "City Line Property",
    "Etihad Town Phase 1",
    "Etihad Town Phase 2",
    "Royal Enclave Lahore",
    "Premier Enclave Lahore",
    "Overseas Block Lahore",
    "1% commission property Lahore",
    "plots for sale Etihad Town",
    "houses for sale Lahore",
    "apartments for rent Lahore",
    "property dealer Lahore",
  ],
  openGraph: {
    title: "City Line Property — Your Key to the City",
    description:
      "Only 1% commission. Plots, houses & apartments in Etihad Town Phase 1 & 2, Royal Enclave, Premier Enclave and Overseas Block — Lahore. Call 0309 4499940.",
    siteName: "City Line Property",
    type: "website",
  },
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
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
