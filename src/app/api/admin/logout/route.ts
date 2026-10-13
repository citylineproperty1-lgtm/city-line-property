import { NextResponse } from "next/server";
import { destroySession, revokeCurrentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Logout = cookie clear + SERVER-SIDE revocation. The revocation row kills
 * the same cookie in any other open tab and keeps a stolen/expired token
 * dead even if a browser cached it. Explicit sign-out only — backgrounding
 * the page no longer logs the owner out.
 */
export async function POST() {
  await revokeCurrentSession();
  await destroySession();
  return NextResponse.json({ ok: true });
}
