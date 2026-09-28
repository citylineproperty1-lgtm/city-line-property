import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guardAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Authenticated media upload — stores the file in Postgres (MediaFile) and
 * returns its public serve path. DB storage keeps uploads alive on serverless
 * (an earlier revision wrote to /public/uploads, which is ephemeral on Vercel).
 *
 * Accepts JPG / PNG / WebP / AVIF up to 4 MB and PDF (society layout plans)
 * up to 4.5 MB. Used by the listing drawer (photos) and the Settings → Area
 * maps card (society block maps). PDFs come back with a `.pdf`-suffixed path
 * (/api/media/<id>.pdf) so the UI can tell documents and images apart.
 */

const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB — stays under serverless body limits
const MAX_PDF_BYTES = Math.floor(4.5 * 1024 * 1024); // Vercel body cap is 4.5 MB
const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
  "application/pdf",
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
        { error: "Only JPG, PNG, WebP, AVIF images or PDF files are allowed." },
        { status: 415 }
      );
    }
    const isPdf = file.type === "application/pdf";
    const maxBytes = isPdf ? MAX_PDF_BYTES : MAX_IMAGE_BYTES;
    if (file.size > maxBytes) {
      return NextResponse.json(
        {
          error: isPdf
            ? "PDF is too large — the limit is 4.5 MB. Export at a lower DPI or compress it."
            : "Image is too large — the limit is 4 MB.",
        },
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
      path: isPdf ? `/api/media/${row.id}.pdf` : `/api/media/${row.id}`,
      filename: row.filename,
      size: row.size,
      mime: row.mime,
    });
  } catch (e) {
    console.error("POST /api/admin/upload", e);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}
