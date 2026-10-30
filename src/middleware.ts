import { NextResponse, type NextRequest } from "next/server";

/**
 * Expose the ORIGINAL request path to server components.
 *
 * next.config rewrites serve the single-page app shell at real, crawlable
 * URLs (/property/<id>, /properties). The shell is rendered by ONE layout —
 * by default it cannot know which URL it is rendering metadata for. This
 * middleware copies the original pathname into a request header so
 * layout.generateMetadata and SeoJsonLd can emit per-URL titles,
 * descriptions, canonicals and JSON-LD (server-rendered — visible to
 * crawlers with or without JS).
 */
export function middleware(req: NextRequest) {
  const headers = new Headers(req.headers);
  headers.set("x-clp-original-path", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/property/:path*", "/properties"],
};
