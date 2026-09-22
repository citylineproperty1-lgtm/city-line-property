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
};

export default nextConfig;
