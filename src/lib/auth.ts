/**
 * Server-only admin auth: scrypt password hashing + HMAC-signed session cookie.
 * No external deps — uses node:crypto only.
 */
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { db } from "./db";

const COOKIE_NAME = "clp_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days
const SECRET = process.env.ADMIN_SESSION_SECRET || "dev-only-secret-change-me";

export interface SessionAdmin {
  id: string;
  email: string;
  name: string;
}

/* ---------------- password hashing ---------------- */

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const test = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (test.length !== expected.length) return false;
  return crypto.timingSafeEqual(test, expected);
}

/* ---------------- session token (HMAC-signed) ---------------- */

function b64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
}

function makeToken(admin: SessionAdmin): string {
  const body = b64url(
    JSON.stringify({
      ...admin,
      exp: Date.now() + MAX_AGE_SECONDS * 1000,
    })
  );
  return `${body}.${sign(body)}`;
}

function readToken(token: string | undefined): SessionAdmin | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof data.exp !== "number" || data.exp < Date.now()) return null;
    return { id: data.id, email: data.email, name: data.name };
  } catch {
    return null;
  }
}

/* ---------------- cookie session API ---------------- */

export async function createSession(admin: SessionAdmin): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, makeToken(admin), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    // Session-scoped cookie (no maxAge): closing the browser drops it
    // automatically. Tab closes / navigations away are covered on top by
    // server-side revocation (revokeCurrentSession + the pagehide beacon).
    secure: false, // sandbox preview runs on http; flip to true behind https
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/* ---------------- server-side revocation ---------------- */

function tokenHash(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function tokenExpiry(token: string): number {
  try {
    const body = token.split(".")[0] ?? "";
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as {
      exp?: number;
    };
    return typeof data.exp === "number" ? data.exp : Date.now() + MAX_AGE_SECONDS * 1000;
  } catch {
    return Date.now() + MAX_AGE_SECONDS * 1000;
  }
}

/**
 * Server-side logout: record the current token's hash so the session stays
 * dead even if the browser keeps the cookie — sendBeacon responses (used for
 * close/navigate-away auto-logout) may not process Set-Cookie headers.
 */
export async function revokeCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return;
  try {
    const expiresAt = new Date(tokenExpiry(token));
    await db.revokedSession.upsert({
      where: { hash: tokenHash(token) },
      update: { expiresAt },
      create: { hash: tokenHash(token), expiresAt },
    });
    // Opportunistic cleanup of revocations whose tokens already expired.
    await db.revokedSession.deleteMany({ where: { expiresAt: { lt: new Date() } } });
  } catch (e) {
    // Never block logout on a revocation hiccup — cookie clearing still runs.
    console.error("revokeCurrentSession", e);
  }
}

export async function getSessionAdmin(): Promise<SessionAdmin | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  const admin = readToken(token);
  if (!admin || !token) return null;
  try {
    const revoked = await db.revokedSession.findUnique({
      where: { hash: tokenHash(token) },
      select: { hash: true },
    });
    if (revoked) return null;
  } catch (e) {
    // DB hiccup: every guarded route queries the DB anyway, so fail open here
    // rather than locking the owner out of an otherwise healthy session.
    console.error("getSessionAdmin revocation check", e);
  }
  return admin;
}

/**
 * Guard for admin API routes.
 * Returns a 401 Response when unauthenticated, otherwise null (caller proceeds).
 */
export async function guardAdmin(): Promise<Response | null> {
  const admin = await getSessionAdmin();
  if (!admin) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** Authenticate with email + password against the AdminUser table. */
export async function authenticate(
  email: string,
  password: string
): Promise<SessionAdmin | null> {
  const user = await db.adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash)) return null;
  return { id: user.id, email: user.email, name: user.name };
}

/** Default owner credentials — used to bootstrap / self-heal the admin account. */
export const DEFAULT_ADMIN_EMAIL = "admin@citylineproperty.com";
export const DEFAULT_ADMIN_PASSWORD = "CityLine@2025";
const DEFAULT_ADMIN_NAME = "City Line Admin";

/**
 * Self-healing bootstrap: if the AdminUser table is empty (fresh/reset DB,
 * schema re-push, etc.) recreate the default admin so the owner is never
 * locked out. Returns the created admin, or null when an admin already exists.
 */
export async function ensureDefaultAdmin(): Promise<SessionAdmin | null> {
  const count = await db.adminUser.count();
  if (count > 0) return null;
  const user = await db.adminUser.create({
    data: {
      email: DEFAULT_ADMIN_EMAIL,
      name: DEFAULT_ADMIN_NAME,
      passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
    },
  });
  return { id: user.id, email: user.email, name: user.name };
}
