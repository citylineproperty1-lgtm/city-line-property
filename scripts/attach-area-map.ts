/**
 * DB-direct area-map attach — bypasses the admin API (works even when the
 * admin password is unknown). Produces the exact same rows the API writes:
 *   MediaFile { filename, mime: image/jpeg, size, data: base64 }
 *   Setting  { key: area_map_<slug>, value: /api/media/<id> }
 *
 * Usage: bun scripts/attach-area-map.ts <image-or-pdf> [area-slug]
 * Requires pdftoppm for PDFs. Runs against the Supabase DB in .env.
 */
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";

const [, , inputArg, slugArg] = process.argv;
const slug = slugArg ?? "etihad-town-phase-1";

if (!inputArg || !existsSync(inputArg)) {
  console.error("Usage: bun scripts/attach-area-map.ts <image-or-pdf> [area-slug]");
  process.exit(1);
}

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "clp-map-"));
  const isPdf = inputArg.toLowerCase().endsWith(".pdf");
  let raster = inputArg;

  if (isPdf) {
    raster = join(dir, "map.png");
    execFileSync("pdftoppm", ["-png", "-r", "170", "-singlefile", inputArg, raster.slice(0, -4)]);
  }

  let quality = 84;
  let jpg = await sharp(raster)
    .flatten({ background: "#ffffff" })
    .resize({ width: 2400, withoutEnlargement: true })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer();

  while (jpg.byteLength > 3.6 * 1024 * 1024 && quality > 55) {
    quality -= 8;
    jpg = await sharp(raster)
      .flatten({ background: "#ffffff" })
      .resize({ width: 2400, withoutEnlargement: true })
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();
  }
  if (jpg.byteLength > 4 * 1024 * 1024) throw new Error("over 4 MB — lower the raster DPI");

  const db = new PrismaClient();
  const media = await db.mediaFile.create({
    data: {
      filename: `layout-plan-${slug}.jpg`,
      mime: "image/jpeg",
      size: jpg.byteLength,
      data: jpg.toString("base64"),
    },
  });
  const path = `/api/media/${media.id}`;
  await db.setting.upsert({
    where: { key: `area_map_${slug}` },
    update: { value: path },
    create: { key: `area_map_${slug}`, value: path },
  });
  const meta = await sharp(jpg).metadata();
  console.log(
    `OK area_map_${slug} = ${path} (${(jpg.byteLength / 1024).toFixed(0)} KB, ` +
      `${meta.width}x${meta.height}, q${quality})`
  );
  await db.$disconnect();
  if (isPdf) unlinkSync(raster);
}

main().catch((e) => {
  console.error("FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
