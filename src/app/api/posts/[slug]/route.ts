import { NextRequest, NextResponse } from "next/server";
import { getPostBySlug } from "@/lib/posts";

export const dynamic = "force-dynamic";

/** Public single post by slug — counts a view (fire-and-forget). */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await ctx.params;
    const post = await getPostBySlug(slug, { publishedOnly: true, countView: true });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    return NextResponse.json({ post });
  } catch (e) {
    console.error("GET /api/posts/[slug]", e);
    return NextResponse.json({ error: "Failed to load post" }, { status: 500 });
  }
}
