import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Deployment marker + uptime probe. Returns the git commit SHA that Vercel
 * baked into this serverless build, so a live check can PROVE which version
 * of the site is actually serving (no more guessing whether a deploy
 * finished before probing an API fix).
 */
export function GET() {
  return NextResponse.json({
    ok: true,
    service: "city-line-property",
    sha: process.env.VERCEL_GIT_COMMIT_SHA ?? "local-dev",
    ts: new Date().toISOString(),
  });
}
