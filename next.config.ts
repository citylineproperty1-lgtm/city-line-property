import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  /* Package the committed SQLite database into every serverless API bundle.
     Without this, hosted builds (Vercel etc.) run API routes with NO database
     file at all — listings come back empty and admin login fails. */
  outputFileTracingIncludes: {
    "/api/**/*": ["./db/**/*"],
    "/api/*": ["./db/**/*"],
  },
  /* Edge-cache the SSR homepage shell + sitemap at the Vercel CDN.
     The shell is identical for every visitor (all personalization is
     client-side via hash routing + /api fetches), so the rendered HTML can
     be served from the edge instead of re-running the function — cutting
     TTFB from seconds to milliseconds and fixing Core Web Vitals (LCP/TTFB)
     reported in Google Search Console. Admin data is NEVER stale: it flows
     through /api routes, which remain uncached. */
  async headers() {
    return [
      {
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, s-maxage=60, stale-while-revalidate=600",
          },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
