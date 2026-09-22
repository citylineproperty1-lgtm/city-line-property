import { db } from "@/lib/db";

/**
 * Property Digest — posts data layer.
 *
 * Implemented with raw SQL (db.$queryRaw / db.$executeRaw) instead of the
 * Prisma model so the long-running dev server never depends on a regenerated
 * Prisma client (the same pitfall as ViewEvent — see worklog Task 9).
 * The Prisma `Post` model in schema.prisma documents the shape and keeps
 * supabase/schema.sql parity.
 *
 * SQLite specifics: booleans are stored as 0/1, datetimes as epoch-ms
 * integers (mirrors how Prisma stores them) so sorting stays numeric.
 */

export interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover: string | null;
  tag: string;
  author: string;
  published: boolean;
  views: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

let tableReady: Promise<void> | null = null;

/** Idempotent CREATE TABLE — memoized so it runs at most once per process. */
export function ensurePostsTable(): Promise<void> {
  if (!tableReady) {
    tableReady = db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Post" (
        "id"        TEXT PRIMARY KEY NOT NULL,
        "title"     TEXT NOT NULL,
        "slug"      TEXT NOT NULL UNIQUE,
        "excerpt"   TEXT NOT NULL DEFAULT '',
        "content"   TEXT NOT NULL DEFAULT '',
        "cover"     TEXT,
        "tag"       TEXT NOT NULL DEFAULT 'Market notes',
        "author"    TEXT NOT NULL DEFAULT 'City Line Property',
        "published" BOOLEAN NOT NULL DEFAULT 1,
        "views"     INTEGER NOT NULL DEFAULT 0,
        "createdAt" DATETIME NOT NULL,
        "updatedAt" DATETIME NOT NULL
      )
    `).then(() => undefined);
  }
  return tableReady;
}

function toDate(v: unknown): string {
  if (typeof v === "number") return new Date(v).toISOString();
  if (v instanceof Date) return v.toISOString();
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n) && n > 1_000_000_000_000) return new Date(n).toISOString();
    const d = new Date(v.includes("T") ? v : v.replace(" ", "T"));
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function toPost(row: any): Post {
  return {
    id: String(row.id),
    title: String(row.title),
    slug: String(row.slug),
    excerpt: String(row.excerpt ?? ""),
    content: String(row.content ?? ""),
    cover: row.cover ?? null,
    tag: String(row.tag ?? "Market notes"),
    author: String(row.author ?? "City Line Property"),
    published: Number(row.published) === 1,
    views: Number(row.views ?? 0),
    createdAt: toDate(row.createdAt),
    updatedAt: toDate(row.updatedAt),
  };
}

export function slugifyPost(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

export async function listPosts(opts: {
  publishedOnly?: boolean;
  limit?: number;
  tag?: string;
}): Promise<Post[]> {
  await ensurePostsTable();
  const where: string[] = [];
  const params: unknown[] = [];
  if (opts.publishedOnly) where.push(`"published" = 1`);
  if (opts.tag) {
    params.push(opts.tag);
    where.push(`"tag" = ?`);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
  params.push(limit);
  const rows = await db.$queryRawUnsafe(
    `SELECT * FROM "Post" ${clause} ORDER BY "createdAt" DESC, "id" DESC LIMIT ?`,
    ...params
  );
  return (rows as any[]).map(toPost);
}

export async function getPostBySlug(slug: string, opts: { publishedOnly?: boolean; countView?: boolean } = {}): Promise<Post | null> {
  await ensurePostsTable();
  const rows = await db.$queryRawUnsafe(
    `SELECT * FROM "Post" WHERE "slug" = ? LIMIT 1`,
    slug
  );
  const list = rows as any[];
  if (list.length === 0) return null;
  const post = toPost(list[0]);
  if (opts.publishedOnly && !post.published) return null;
  if (opts.countView) {
    await db
      .$executeRawUnsafe(`UPDATE "Post" SET "views" = "views" + 1 WHERE "id" = ?`, post.id)
      .catch(() => {});
    post.views += 1;
  }
  return post;
}

export async function getPostById(id: string): Promise<Post | null> {
  await ensurePostsTable();
  const rows = await db.$queryRawUnsafe(`SELECT * FROM "Post" WHERE "id" = ? LIMIT 1`, id);
  const list = rows as any[];
  return list.length ? toPost(list[0]) : null;
}

export interface PostInput {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover: string | null;
  tag: string;
  author: string;
  published: boolean;
}

export async function createPost(input: PostInput): Promise<Post> {
  await ensurePostsTable();
  const id = `post_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const now = Date.now();
  await db.$executeRawUnsafe(
    `INSERT INTO "Post" ("id","title","slug","excerpt","content","cover","tag","author","published","views","createdAt","updatedAt")
     VALUES (?,?,?,?,?,?,?,?,?,0,?,?)`,
    id,
    input.title,
    input.slug,
    input.excerpt,
    input.content,
    input.cover,
    input.tag,
    input.author,
    input.published ? 1 : 0,
    now,
    now
  );
  return (await getPostById(id))!;
}

export async function updatePost(id: string, input: PostInput): Promise<Post | null> {
  await ensurePostsTable();
  await db.$executeRawUnsafe(
    `UPDATE "Post" SET "title"=?,"slug"=?,"excerpt"=?,"content"=?,"cover"=?,"tag"=?,"author"=?,"published"=?,"updatedAt"=? WHERE "id"=?`,
    input.title,
    input.slug,
    input.excerpt,
    input.content,
    input.cover,
    input.tag,
    input.author,
    input.published ? 1 : 0,
    Date.now(),
    id
  );
  return getPostById(id);
}

export async function deletePost(id: string): Promise<void> {
  await ensurePostsTable();
  await db.$executeRawUnsafe(`DELETE FROM "Post" WHERE "id" = ?`, id);
}
