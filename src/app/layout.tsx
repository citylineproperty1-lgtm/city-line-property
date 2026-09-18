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
  title: "City Line Property — Karachi's Trusted Real Estate Partner",
  description:
    "Buy, sell and rent premium homes, apartments, villas and offices across Karachi. City Line Property combines deep local expertise with a modern, transparent experience.",
  keywords: [
    "City Line Property",
    "real estate Karachi",
    "property for sale Karachi",
    "rent apartment Karachi",
    "DHA Clifton villas",
  ],
  openGraph: {
    title: "City Line Property",
    description: "Find a place you'll love to live — premium real estate across Karachi.",
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
      <body className={`${inter.variable} font-sans antialiased bg-white text-neutral-900`}>
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
