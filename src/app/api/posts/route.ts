import { NextRequest, NextResponse } from "next/server";
import { listPosts } from "@/lib/posts";

export const dynamic = "force-dynamic";

/** Public Property Digest feed — published posts, newest first. */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get("limit") ?? 50);
    const tag = searchParams.get("tag") ?? undefined;
    const posts = await listPosts({
      publishedOnly: true,
      limit: Number.isFinite(limit) ? limit : 50,
      tag: tag || undefined,
    });
    return NextResponse.json({ posts });
  } catch (e) {
    console.error("GET /api/posts", e);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}
