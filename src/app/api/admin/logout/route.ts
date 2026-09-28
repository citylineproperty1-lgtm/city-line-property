import { NextResponse } from "next/server";
import { destroySession, revokeCurrentSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Logout = cookie clear + SERVER-SIDE revocation. The revocation row is what
 * actually kills the session when the caller is a pagehide/sendBeacon ping
 * (browsers may skip Set-Cookie processing for beacon responses), and it also
 * instantly invalidates the same cookie in any other open tab.
 */
export async function POST() {
  await revokeCurrentSession();
  await destroySession();
  return NextResponse.json({ ok: true });
}
