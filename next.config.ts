import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* sharp is a native module (libvips via @img/* platform packages). When
     bundled into the serverless function, its runtime require() of the
     platform binary fails on Vercel and EVERY request to routes importing
     sharp returns a bare 500 (the admin photo upload broke exactly this
     way). Keeping it external makes Next load it from node_modules at
     runtime, where the native bindings resolve correctly. */
  serverExternalPackages: ["sharp"],
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  /* Package the committed SQLite database into every serverless API bundle.
     Without this, hosted builds (Vercel etc.) run API routes with NO database
     file at all — listings come back empty and admin login fails.
     sharp + @img/* are force-included as well: sharp resolves its native
     libvips binary through runtime requires that the bundler's file tracer
     cannot follow, so the trace alone drops them from the serverless bundle
     and `import("sharp")` fails at runtime (upload route 503). */
  outputFileTracingIncludes: {
    "/api/**/*": [
      "./db/**/*",
      "./node_modules/sharp/**/*",
      "./node_modules/@img/**/*",
    ],
    "/api/*": [
      "./db/**/*",
      "./node_modules/sharp/**/*",
      "./node_modules/@img/**/*",
    ],
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
        // Site-wide security hardening (all routes).
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            /* microphone=(self): the CLP Assistant's voice input needs the
               mic on our own origin. () would silently disable it for every
               visitor on every device — no permission prompt ever appears.
               Camera stays off (no feature uses it). */
            value: "camera=(), geolocation=(self), microphone=(self)",
          },
        ],
      },
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
