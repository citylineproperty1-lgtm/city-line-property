import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin, getSessionAdmin, hashPassword, verifyPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Change the admin account password. */
export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const currentPassword = (body.currentPassword ?? "").toString();
    const newPassword = (body.newPassword ?? "").toString();

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const me = await getSessionAdmin();
    if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await db.adminUser.findUnique({ where: { id: me.id } });
    if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

    if (!verifyPassword(currentPassword, user.passwordHash)) {
      return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
    }

    await db.adminUser.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(newPassword) },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST /api/admin/password", e);
    return NextResponse.json({ error: "Could not change password." }, { status: 500 });
  }
}
