/**
 * Society layout-plan map uploader — turns an uploaded PDF/JPG/PNG into a
 * web-optimized map image and attaches it to an area guide.
 *
 * Usage:
 *   bun scripts/upload-area-map.ts <pdf-or-image-path> [area-slug]
 *
 * Defaults: slug = etihad-town-phase-1, base = http://localhost:3000
 *
 * Pipeline:
 *   PDF  -> pdftoppm (rasterize ~170 DPI)
 *   image-> sharp (max width 2400, JPEG q84, <= 3.6 MB)
 *   POST /api/admin/upload (MediaFile row, same Supabase DB as production)
 *   PUT  /api/admin/settings { area_map_<slug>: "/api/media/<id>" }
 *
 * Production serves the map immediately (settings + media live in the shared
 * DB) — no redeploy needed. Requires the dev server running.
 */
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, statSync, unlinkSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";

const BASE = process.env.CLP_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.CLP_ADMIN_EMAIL ?? "admin";
const PASSWORD = process.env.CLP_ADMIN_PASSWORD ?? "CityLine@2025";

const [, , inputArg, slugArg] = process.argv;
const slug = slugArg ?? "etihad-town-phase-1";

if (!inputArg) {
  console.error("Usage: bun scripts/upload-area-map.ts <pdf-or-image-path> [area-slug]");
  process.exit(1);
}
if (!existsSync(inputArg)) {
  console.error(`Input not found: ${inputArg}`);
  process.exit(1);
}

function cookieFrom(res: Response): string {
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const pairs = setCookie.map((c) => c.split(";")[0]);
  return pairs.join("; ");
}

async function login(): Promise<string> {
  const res = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status} ${await res.text()}`);
  const cookie = cookieFrom(res);
  if (!cookie.includes("clp_admin")) throw new Error("login did not set clp_admin cookie");
  return cookie;
}

async function upload(cookie: string, file: Buffer, name: string): Promise<string> {
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(file)], { type: "image/jpeg" }), name);
  const res = await fetch(`${BASE}/api/admin/upload`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: form,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`upload failed: ${res.status} ${text}`);
  const { path } = JSON.parse(text) as { path: string };
  return path;
}

async function saveSetting(cookie: string, path: string): Promise<void> {
  const res = await fetch(`${BASE}/api/admin/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ [`area_map_${slug}`]: path }),
  });
  if (!res.ok) throw new Error(`settings PUT failed: ${res.status} ${await res.text()}`);
}

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "clp-map-"));
  const ext = basename(inputArg).toLowerCase().endsWith(".pdf") ? "pdf" : "img";
  let raster: string;

  if (ext === "pdf") {
    raster = join(dir, "map");
    // -r 170 keeps small labels readable after downscale; -singlefile writes map.png
    execFileSync("pdftoppm", ["-png", "-r", "170", "-singlefile", inputArg, raster]);
    raster += ".png";
  } else {
    raster = inputArg;
  }

  // Fit within 2400px wide, white background (plans are line art on white).
  let quality = 84;
  let jpg: Buffer = await sharp(raster)
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
  if (jpg.byteLength > 4 * 1024 * 1024) throw new Error("still over 4 MB after quality steps");

  const name = `layout-plan-${slug}.jpg`;
  const cookie = await login();
  const path = await upload(cookie, jpg, name);
  await saveSetting(cookie, path);

  const meta = await sharp(jpg).metadata();
  console.log(
    `OK area_map_${slug} = ${path}  (${(jpg.byteLength / 1024).toFixed(0)} KB, ` +
      `${meta.width}x${meta.height}, q${quality})`
  );
  if (ext === "pdf" && raster !== inputArg && existsSync(raster)) unlinkSync(raster);
}

main().catch((e) => {
  console.error("FAILED:", e instanceof Error ? e.message : e);
  process.exit(1);
});
