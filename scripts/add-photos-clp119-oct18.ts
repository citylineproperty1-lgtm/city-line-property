/**
 * Task 118 — owner follow-up for CLP-119 (5 Marla house, 4 beds, 2 kitchens):
 * append the second batch of WhatsApp photos (10 files, 12.20.46–12.20.50 PM).
 *
 * Photos go through the SAME pipeline as admin uploads and Tasks 113/114/115
 * (see src/app/api/admin/upload/route.ts): EXIF rotate → flatten → cap 1920px →
 * bake the 45° diagonal CLP watermark (v5 lockup) → JPEG q82 → MediaFile row
 * served from /api/media/<id>. These are clean originals (fresh from WhatsApp),
 * so watermarking them once here is correct — never re-watermark a baked image.
 *
 * Naming continues Task 115's sequence: 5marla-house-4bed-01..10.jpg existed,
 * this batch becomes 5marla-house-4bed-11..20.jpg in the owner's listed order.
 * Guard: aborts unless CLP-119 currently has exactly 10 images (double-run
 * protection — re-running after success would need the guard raised first).
 *
 * Run: env -u DATABASE_URL -u DIRECT_URL bun scripts/add-photos-clp119-oct18.ts
 */
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { WATERMARK_LOCKUP_BASE64 } from "../src/lib/watermark-lockup";

const db = new PrismaClient();

const MAX_WIDTH = 1920;
const lockupBuffer = Buffer.from(WATERMARK_LOCKUP_BASE64, "base64");

const REFERENCE = "CLP-119";
const EXPECT_EXISTING = 10;

// Owner's listed order (10 files, md5-verified unique within the batch).
const NEW_PHOTOS = [
  "WhatsApp Image 2026-10-16 at 12.20.46 PM (1).jpeg",
  "WhatsApp Image 2026-10-16 at 12.20.46 PM.jpeg",
  "WhatsApp Image 2026-10-16 at 12.20.47 PM (1).jpeg",
  "WhatsApp Image 2026-10-16 at 12.20.47 PM (2).jpeg",
  "WhatsApp Image 2026-10-16 at 12.20.47 PM.jpeg",
  "WhatsApp Image 2026-10-16 at 12.20.48 PM (1).jpeg",
  "WhatsApp Image 2026-10-16 at 12.20.48 PM (2).jpeg",
  "WhatsApp Image 2026-10-16 at 12.20.48 PM.jpeg",
  "WhatsApp Image 2026-10-16 at 12.20.49 PM (1).jpeg",
  "WhatsApp Image 2026-10-16 at 12.20.50 PM (2).jpeg",
];

async function watermarkAndStore(
  filePath: string,
  cleanName: string
): Promise<string> {
  const raw = readFileSync(filePath);
  const base = sharp(raw, { failOn: "none" })
    .rotate()
    .flatten({ background: "#ffffff" })
    .resize({ width: MAX_WIDTH, withoutEnlargement: true });
  const resized = await base.toBuffer();
  const meta = await sharp(resized).metadata();
  const w = meta.width ?? MAX_WIDTH;
  const h = meta.height ?? Math.round((meta.width ?? 1) * 1.0);

  // 45° diagonal center mark — same geometry as the upload route (v5).
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

  const out = await sharp(resized)
    .composite([{ input: lockup, left, top }])
    .jpeg({ quality: 82, progressive: true, mozjpeg: true })
    .toBuffer();

  const row = await db.mediaFile.create({
    data: {
      filename: cleanName,
      mime: "image/jpeg",
      size: out.length,
      data: out.toString("base64"),
    },
    select: { id: true },
  });
  console.log(`  ✓ ${cleanName} → /api/media/${row.id} (${out.length} bytes)`);
  return `/api/media/${row.id}`;
}

async function main() {
  const property = await db.property.findFirst({
    where: { reference: REFERENCE },
    select: { id: true, reference: true, title: true, images: true },
  });
  if (!property) throw new Error(`${REFERENCE} not found`);

  const existing = JSON.parse(property.images) as string[];
  console.log(
    `${REFERENCE}: "${property.title}" — images=${existing.length} (expect ${EXPECT_EXISTING})`
  );
  if (existing.length !== EXPECT_EXISTING) {
    throw new Error(
      `Abort: CLP-119 has ${existing.length} images, expected ${EXPECT_EXISTING}. ` +
        `If this batch was already added (double-run) or partially edited, raise EXPECT_EXISTING deliberately.`
    );
  }

  // ---- watermark + store the new photos ----
  const uploadDir = join(process.cwd(), "upload");
  const present = new Set(readdirSync(uploadDir));
  const added: string[] = [];
  let n = existing.length; // continue the naming sequence from batch 1
  for (const name of NEW_PHOTOS) {
    if (!present.has(name)) {
      console.warn(`  ! missing upload file: ${name} — skipped`);
      continue;
    }
    n += 1;
    const clean = `5marla-house-4bed-${String(n).padStart(2, "0")}.jpg`;
    const path = await watermarkAndStore(join(uploadDir, name), clean);
    added.push(path);
  }
  if (added.length === 0) throw new Error("No new photos processed");

  // ---- append in ONE update ----
  const images = [...existing, ...added];
  const row = await db.property.update({
    where: { id: property.id },
    data: { images: JSON.stringify(images) },
    select: { reference: true },
  });
  console.log(
    `Updated ${row.reference}: images=${existing.length} → ${images.length} (+${added.length})`
  );
  await db.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await db.$disconnect();
  process.exit(1);
});
