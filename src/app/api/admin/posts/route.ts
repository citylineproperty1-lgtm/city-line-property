import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/auth";
import {
  createPost,
  listPosts,
  slugifyPost,
  type PostInput,
} from "@/lib/posts";

export const dynamic = "force-dynamic";

/** Admin Digest management — list all posts (drafts included). */
export async function GET() {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const posts = await listPosts({ publishedOnly: false, limit: 100 });
    return NextResponse.json({ posts });
  } catch (e) {
    console.error("GET /api/admin/posts", e);
    return NextResponse.json({ error: "Failed to load posts" }, { status: 500 });
  }
}

/** Create a digest post. */
export async function POST(req: NextRequest) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const title = (body.title ?? "").toString().trim();
    if (title.length < 4) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    let slug = slugifyPost((body.slug ?? title).toString());
    const content = (body.content ?? "").toString();
    const excerpt =
      (body.excerpt ?? "").toString().trim() ||
      content.replace(/[#*`>]/g, "").trim().slice(0, 160);
    const input: PostInput = {
      title,
      slug,
      excerpt,
      content,
      cover: (body.cover ?? "").toString().trim() || null,
      tag: (body.tag ?? "Market notes").toString().trim() || "Market notes",
      author: (body.author ?? "City Line Property").toString().trim() || "City Line Property",
      published: body.published !== false,
    };
    // Ensure unique slug (append -2, -3… when taken)
    const { getPostBySlug } = await import("@/lib/posts");
    let n = 1;
    while (await getPostBySlug(input.slug)) {
      n += 1;
      input.slug = `${slug}-${n}`;
    }
    const post = await createPost(input);
    return NextResponse.json({ post }, { status: 201 });
  } catch (e) {
    console.error("POST /api/admin/posts", e);
    return NextResponse.json({ error: "Could not create post." }, { status: 500 });
  }
}
