import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/auth";
import { WATERMARK_LOCKUP_BASE64 } from "@/lib/watermark-lockup";

export const runtime = "nodejs"; // sharp requires the Node runtime
export const dynamic = "force-dynamic";

/**
 * Admin image upload — bakes the CLP watermark into the pixels.
 *
 * Like zameen.com, every listing photo carries the brand mark so downloaded
 * copies stay branded: a semi-transparent golden CLP logo + light-weight
 * "City Line Property" wordmark + the "citylineproperty.com.pk" address
 * line — rotated 45° DIAGONAL and centered (owner spec), sized so the
 * diagonal always fits the frame. The watermark is part of the stored
 * image — it cannot be stripped by copying the file.
 *
 * Pipeline: EXIF rotate → flatten → cap 1920px → composite watermark →
 * JPEG q82 progressive → stored in the MediaFile table (base64) and served
 * from /api/media/<id> with immutable edge caching.
 */
const MAX_BYTES = 10 * 1024 * 1024; // 10MB raw upload cap
const MAX_WIDTH = 1920; // matches the site photo pipeline
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

const lockupBuffer = Buffer.from(WATERMARK_LOCKUP_BASE64, "base64");

export async function POST(req: NextRequest) {
  const unauthorized = await guardAdmin();
  if (unauthorized) return unauthorized;

  let file: File | null = null;
  try {
    const fd = await req.formData();
    const candidate = fd.get("file");
    if (candidate instanceof File) file = candidate;
  } catch {
    return NextResponse.json({ error: "Malformed upload. Please try again." }, { status: 400 });
  }
  if (!file) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPG, PNG or WebP images are allowed." },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image is too large (max 10MB)." }, { status: 413 });
  }

  try {
    const raw = Buffer.from(await file.arrayBuffer());

    // 1) Orient by EXIF, flatten any transparency onto white, cap width.
    const base = sharp(raw, { failOn: "none" })
      .rotate()
      .flatten({ background: "#ffffff" })
      .resize({ width: MAX_WIDTH, withoutEnlargement: true });
    const resized = await base.toBuffer();
    const meta = await sharp(resized).metadata();
    const w = meta.width ?? MAX_WIDTH;
    const h = meta.height ?? Math.round((meta.width ?? 1) * 1.0);

    // 2) Watermark geometry — 45° DIAGONAL center mark (owner spec):
    //    bigger, light-weight, rotated mark. The lockup asset is a
    //    tight-cropped square (text runs corner to corner), so size it by
    //    the frame HEIGHT (h*0.92, width-capped at w*0.85) so the diagonal
    //    always fits inside the photo. Same rules as the batch script.
    const lockupW = Math.min(
      1200,
      Math.max(220, Math.min(Math.round(w * 0.85), Math.round(h * 0.92)))
    );
    const lockup = await sharp(lockupBuffer)
      .resize({ width: lockupW })
      .png()
      .toBuffer();
    const lm = await sharp(lockup).metadata();
    const left = Math.round((w - lockupW) / 2);
    const top = Math.round((h - (lm.height ?? 1)) / 2);

    // 3) Bake + encode.
    const out = await sharp(resized)
      .composite([{ input: lockup, left, top }])
      .jpeg({ quality: 82, progressive: true, mozjpeg: true })
      .toBuffer();

    const row = await db.mediaFile.create({
      data: {
        filename: (file.name || "photo.jpg").replace(/\.[a-z0-9]+$/i, "") + ".jpg",
        mime: "image/jpeg",
        size: out.length,
        data: out.toString("base64"),
      },
      select: { id: true },
    });

    return NextResponse.json({ ok: true, path: `/api/media/${row.id}` });
  } catch (e) {
    console.error("POST /api/admin/upload", e);
    return NextResponse.json(
      { error: "Could not process this image — try a different file." },
      { status: 500 }
    );
  }
}
