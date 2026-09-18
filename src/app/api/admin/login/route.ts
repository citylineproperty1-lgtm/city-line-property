import { NextRequest, NextResponse } from "next/server";
import { authenticate, createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Admin login — the only gate. Not linked anywhere on the public site. */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email ?? "").toString();
    const password = (body.password ?? "").toString();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    const admin = await authenticate(email, password);
    if (!admin) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    await createSession(admin);
    return NextResponse.json({ ok: true, admin });
  } catch (e) {
    console.error("POST /api/admin/login", e);
    return NextResponse.json({ error: "Login failed. Try again." }, { status: 500 });
  }
}
