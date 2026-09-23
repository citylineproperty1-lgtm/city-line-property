import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "City Line Property — Real Estate in Etihad Town, Lahore",
    short_name: "City Line",
    description:
      "Buy, sell & rent property in Etihad Town, Lahore — only 1% commission, direct dealing, no middlemen.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#0F766E",
    categories: ["business", "shopping", "lifestyle"],
    icons: [
      { src: "/logo.png", sizes: "192x192", type: "image/png" },
      { src: "/logo.png", sizes: "512x512", type: "image/png" },
      { src: "/logo.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
