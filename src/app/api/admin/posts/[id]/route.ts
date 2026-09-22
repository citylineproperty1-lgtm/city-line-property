import { NextRequest, NextResponse } from "next/server";
import { guardAdmin } from "@/lib/auth";
import {
  deletePost,
  getPostById,
  getPostBySlug,
  slugifyPost,
  updatePost,
  type PostInput,
} from "@/lib/posts";

export const dynamic = "force-dynamic";

/** Update a digest post (all fields optional-patch). */
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const existing = await getPostById(id);
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    const body = await req.json();
    const title = (body.title ?? existing.title).toString().trim();
    if (title.length < 4) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }
    let slug = (body.slug ?? existing.slug).toString();
    if (slug !== existing.slug) {
      slug = slugifyPost(slug);
      const taken = await getPostBySlug(slug);
      if (taken && taken.id !== id) {
        return NextResponse.json({ error: "A post with this slug already exists." }, { status: 409 });
      }
    }
    const content = (body.content ?? existing.content).toString();
    const input: PostInput = {
      title,
      slug,
      excerpt: (body.excerpt ?? existing.excerpt).toString().trim(),
      content,
      cover: body.cover !== undefined ? (body.cover ?? "").toString().trim() || null : existing.cover,
      tag: (body.tag ?? existing.tag).toString().trim() || "Market notes",
      author: (body.author ?? existing.author).toString().trim() || "City Line Property",
      published: body.published !== undefined ? body.published !== false : existing.published,
    };
    const post = await updatePost(id, input);
    return NextResponse.json({ post });
  } catch (e) {
    console.error("PATCH /api/admin/posts/[id]", e);
    return NextResponse.json({ error: "Could not update post." }, { status: 500 });
  }
}

/** Delete a digest post. */
export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const denied = await guardAdmin();
  if (denied) return denied;
  try {
    const { id } = await ctx.params;
    const existing = await getPostById(id);
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    await deletePost(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("DELETE /api/admin/posts/[id]", e);
    return NextResponse.json({ error: "Could not delete post." }, { status: 500 });
  }
}
