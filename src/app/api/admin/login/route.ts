import { NextRequest, NextResponse } from "next/server";
import { authenticate, createSession, ensureDefaultAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** "admin" is accepted as a shorthand username for the owner account. */
function normalizeEmail(raw: string): string {
  const v = raw.trim().toLowerCase();
  if (v === "admin" || v === "admin@citylineproperty") return "admin@citylineproperty.com";
  return v;
}

/**
 * Admin login — the only gate. Not linked anywhere on the public site.
 *
 * Resilience rules:
 *  - Wrong credentials  → 401 "Invalid email or password."
 *  - Empty admin table  → auto-bootstrap the default owner account, then retry once.
 *  - Transient DB error → retry once before failing.
 *  - Hard failure       → 500 with a retry hint (full stack goes to server logs).
 */
export async function POST(req: NextRequest) {
  let email = "";
  let password = "";
  try {
    const body = await req.json();
    email = (body.email ?? "").toString();
    password = (body.password ?? "").toString();
  } catch {
    return NextResponse.json({ error: "Malformed request. Please try again." }, { status: 400 });
  }
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const normalized = normalizeEmail(email);

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const admin = await authenticate(normalized, password);
      if (admin) {
        await createSession(admin);
        return NextResponse.json({ ok: true, admin });
      }
      // Credentials rejected — but if the admin table is empty (fresh or
      // reset database) bootstrap the default owner and try once more.
      if (attempt === 1) {
        const bootstrapped = await ensureDefaultAdmin();
        if (bootstrapped) continue;
      }
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    } catch (e) {
      console.error(`POST /api/admin/login (attempt ${attempt})`, e);
      if (attempt === 1) continue; // one retry for transient DB hiccups
      return NextResponse.json(
        { error: "Server error — please wait a few seconds and try again." },
        { status: 500 }
      );
    }
  }

  // Unreachable, but keeps TypeScript honest.
  return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
}
