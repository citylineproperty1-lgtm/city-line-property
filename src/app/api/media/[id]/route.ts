import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Public media serve route for DB-stored uploads (/api/media/<id>).
 * Content is immutable per id, so responses are cached hard at the edge.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const row = await db.mediaFile.findUnique({ where: { id } });
    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const bytes = Buffer.from(row.data, "base64");
    return new Response(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": row.mime,
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Disposition": `inline; filename="${encodeURIComponent(row.filename)}"`,
      },
    });
  } catch (e) {
    console.error("GET /api/media/[id]", e);
    return NextResponse.json({ error: "Failed to load media" }, { status: 500 });
  }
}
