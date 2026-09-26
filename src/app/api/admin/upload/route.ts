import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Authenticated media upload — stores the file in Postgres (MediaFile) and
 * returns its public serve path. DB storage keeps uploads alive on serverless
 * (an earlier revision wrote to /public/uploads, which is ephemeral on Vercel).
 *
 * Accepts JPG / PNG / WebP / AVIF up to 4 MB. Used by the listing drawer
 * (photos) and the Settings → Area maps card (society block maps).
 */

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB — stays under serverless body limits
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: "Only JPG, PNG, WebP or AVIF images are allowed." },
        { status: 415 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image is too large — the limit is 4 MB." },
        { status: 413 }
      );
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const safeName = (file.name || "upload")
      .replace(/[^\w.\- ]+/g, "_")
      .slice(0, 120) || "upload";

    const row = await db.mediaFile.create({
      data: {
        filename: safeName,
        mime: file.type,
        size: buf.length,
        data: buf.toString("base64"),
      },
    });

    return NextResponse.json({
      path: `/api/media/${row.id}`,
      filename: row.filename,
      size: row.size,
    });
  } catch (e) {
    console.error("POST /api/admin/upload", e);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
