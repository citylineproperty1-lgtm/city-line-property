"use client";

/**
 * Digest tab — manage Property Digest editorial posts (market notes, guides,
 * area updates). Create / edit / publish / delete; published posts appear on
 * the public site immediately (admin ⇄ front-page direct link).
 */

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Eye,
  FileText,
  ImagePlus,
  Link2,
  Loader2,
  Newspaper,
  Pencil,
  Plus,
  Send,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  AdminApi,
  AdminCard,
  GOLD_BTN,
  GOLD_OUTLINE,
  errorMessage,
  fadeUp,
  isAuthLoss,
} from "./admin-shared";

interface AdminPost {
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
  createdAt: string;
}

interface PostForm {
  title: string;
  tag: string;
  excerpt: string;
  cover: string;
  content: string;
  published: boolean;
}

const EMPTY_FORM: PostForm = {
  title: "",
  tag: "Market notes",
  excerpt: "",
  cover: "",
  content: "",
  published: true,
};

const TAG_SUGGESTIONS = ["Market notes", "Guides", "Area updates", "News"];

export function AdminDigest({ api }: { api: AdminApi }) {
  const [state, setState] = useState<{ key: string; posts: AdminPost[] } | null>(null);
  const [reload, setReload] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<AdminPost | null>(null);
  const [form, setForm] = useState<PostForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminPost | null>(null);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const key = `posts-${reload}`;

  useEffect(() => {
    let alive = true;
    api<{ posts: AdminPost[] }>("/api/admin/posts")
      .then((d) => {
        if (alive) setState({ key, posts: d.posts });
      })
      .catch((err) => {
        if (!alive || isAuthLoss(err)) return;
        setLoadError(errorMessage(err));
        setState({ key, posts: [] });
      });
    return () => {
      alive = false;
    };
  }, [key, api]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: AdminPost) => {
    setEditing(p);
    setForm({
      title: p.title,
      tag: p.tag,
      excerpt: p.excerpt,
      cover: p.cover ?? "",
      content: p.content,
      published: p.published,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (form.title.trim().length < 4) {
      toast.error("Give the post a title first.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        tag: form.tag.trim() || "Market notes",
        excerpt: form.excerpt.trim(),
        cover: form.cover.trim(),
        content: form.content,
        published: form.published,
      };
      if (editing) {
        await api(`/api/admin/posts/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
        toast.success("Post updated");
      } else {
        await api("/api/admin/posts", { method: "POST", body: JSON.stringify(payload) });
        toast.success(form.published ? "Post published" : "Draft saved");
      }
      setDialogOpen(false);
      setReload((r) => r + 1);
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (p: AdminPost, published: boolean) => {
    try {
      await api(`/api/admin/posts/${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ published }),
      });
      toast.success(published ? "Post published" : "Moved to drafts");
      setReload((r) => r + 1);
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    }
  };

  const doDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api(`/api/admin/posts/${deleteTarget.id}`, { method: "DELETE" });
      toast.success(`"${deleteTarget.title.slice(0, 40)}…" deleted`);
      setDeleteTarget(null);
      setReload((r) => r + 1);
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const uploadCover = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const d = await api<{ path: string }>("/api/admin/upload", { method: "POST", body: fd });
      setForm((f) => ({ ...f, cover: d.path }));
    } catch (err) {
      if (!isAuthLoss(err)) toast.error(errorMessage(err));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const posts = state?.posts ?? [];
  const loaded = state?.key === key;
  const publishedCount = posts.filter((p) => p.published).length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <motion.div {...fadeUp}>
        <AdminCard className="p-4 sm:p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-neutral-900">
                <Newspaper className="h-4 w-4 text-[#C9A227]" />
                Property Digest
              </h2>
              <p className="mt-0.5 text-[12.5px] text-neutral-500">
                {loaded
                  ? `${posts.length} post(s) · ${publishedCount} published · appears on #/digest instantly`
                  : "Loading posts…"}
              </p>
            </div>
            <Button onClick={openAdd} className={`h-10 rounded-full px-4 text-[13px] font-semibold ${GOLD_BTN}`}>
              <Plus className="h-4 w-4" />
              New post
            </Button>
          </div>
          {loadError && (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[12.5px] font-medium text-red-600">
              {loadError}
            </p>
          )}
        </AdminCard>
      </motion.div>

      {/* Post cards */}
      {!loaded ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-3xl" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <AdminCard className="p-10 text-center">
          <FileText className="mx-auto h-10 w-10 text-neutral-300" />
          <p className="mt-3 text-[14.5px] font-semibold text-neutral-900">No posts yet</p>
          <p className="mt-1 text-[13px] text-neutral-500">
            Write the first market note — it goes live on the public digest as soon as you publish.
          </p>
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {posts.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3, ease: "easeOut" }}
            >
              <AdminCard className="flex items-center gap-4 p-4 sm:px-5">
                {/* Cover thumb */}
                <span className="relative hidden h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-[#F5EDD7] sm:block">
                  {p.cover ? (
                    <Image src={p.cover} alt="" fill sizes="96px" className="object-cover" unoptimized />
                  ) : (
                    <span className="flex h-full items-center justify-center">
                      <Newspaper className="h-6 w-6 text-[#C9A227]/50" />
                    </span>
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#F5EDD7] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8A7119]">
                      {p.tag}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold",
                        p.published
                          ? "border-[#34C759]/30 bg-[#34C759]/10 text-[#1E8E3E]"
                          : "border-black/10 bg-black/[0.04] text-neutral-500"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          p.published ? "bg-[#34C759]" : "bg-neutral-400"
                        )}
                      />
                      {p.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="mt-1.5 truncate text-[14px] font-semibold tracking-tight text-neutral-900">
                    {p.title}
                  </p>
                  <p className="mt-0.5 flex items-center gap-3 text-[11.5px] text-neutral-400">
                    <span>{formatDate(p.createdAt)}</span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {p.views.toLocaleString()} views
                    </span>
                  </p>
                </div>

                {/* Published toggle */}
                <div className="flex shrink-0 items-center gap-3">
                  <label className="hidden items-center gap-2 sm:flex">
                    <Switch
                      checked={p.published}
                      onCheckedChange={(v) => void togglePublished(p, v)}
                      aria-label={`Toggle published for ${p.title}`}
                    />
                    <span className="text-[11px] font-medium text-neutral-500">Live</span>
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(p)}
                      className={`h-8 rounded-full px-3 text-[12px] font-semibold ${GOLD_OUTLINE}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeleteTarget(p)}
                      className="h-8 rounded-full border-red-200 px-2.5 text-red-500 hover:bg-red-50 hover:text-red-600"
                      aria-label={`Delete ${p.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </AdminCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Add / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[88vh] overflow-y-auto rounded-3xl sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[16px] font-semibold tracking-tight">
              {editing ? "Edit post" : "New digest post"}
            </DialogTitle>
            <DialogDescription className="text-[12.5px]">
              Blank line = new paragraph. Start a line with &quot;## &quot; for a heading.
              {editing?.published && " Published posts appear on the public digest instantly."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3.5 py-1">
            <div className="grid gap-1.5">
              <Label htmlFor="post-title" className="text-[12px] font-semibold text-neutral-600">
                Title *
              </Label>
              <Input
                id="post-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Why Phase 2 plots are moving fast right now"
                className="h-10 rounded-xl"
              />
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <div className="grid gap-1.5">
                <Label htmlFor="post-tag" className="text-[12px] font-semibold text-neutral-600">
                  Tag
                </Label>
                <Input
                  id="post-tag"
                  value={form.tag}
                  onChange={(e) => setForm((f) => ({ ...f, tag: e.target.value }))}
                  className="h-10 rounded-xl"
                />
                <div className="flex flex-wrap gap-1.5">
                  {TAG_SUGGESTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, tag: t }))}
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10.5px] font-medium transition-colors",
                        form.tag === t
                          ? "border-[#C9A227]/50 bg-[#F5EDD7] text-[#8A7119]"
                          : "border-black/10 bg-white text-neutral-500 hover:bg-neutral-50"
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="post-cover" className="text-[12px] font-semibold text-neutral-600">
                  Cover image
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Link2 className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                    <Input
                      id="post-cover"
                      value={form.cover}
                      onChange={(e) => setForm((f) => ({ ...f, cover: e.target.value }))}
                      placeholder="/images/… or URL"
                      className="h-10 rounded-xl pl-9"
                    />
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadCover(f);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => fileRef.current?.click()}
                    className="h-10 rounded-xl px-3"
                  >
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  </Button>
                </div>
                {form.cover.trim() && (
                  <span className="relative mt-1 h-24 overflow-hidden rounded-xl border border-black/[0.08] bg-neutral-50">
                    <Image
                      src={form.cover.trim()}
                      alt="Cover preview"
                      fill
                      sizes="480px"
                      className="object-cover"
                      unoptimized
                    />
                  </span>
                )}
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="post-excerpt" className="text-[12px] font-semibold text-neutral-600">
                Excerpt <span className="font-normal text-neutral-400">· shown on cards (auto from content if empty)</span>
              </Label>
              <Textarea
                id="post-excerpt"
                value={form.excerpt}
                onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
                rows={2}
                className="resize-none rounded-xl"
                placeholder="One or two sentences that sell the article…"
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="post-content" className="text-[12px] font-semibold text-neutral-600">
                Article
              </Label>
              <Textarea
                id="post-content"
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                rows={12}
                className="rounded-xl leading-relaxed"
                placeholder={"Opening paragraph…\n\n## A section heading\n\nMore paragraphs…\n\n1. A numbered list\n2. Second point"}
              />
              <p className="flex items-center gap-1.5 text-[11px] text-neutral-400">
                <FileText className="h-3 w-3" />
                {form.content.trim() ? form.content.trim().split(/\s+/).length : 0} words ·{" "}
                {Math.max(1, Math.round((form.content.trim() ? form.content.trim().split(/\s+/).length : 0) / 200))} min read
              </p>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-black/[0.07] bg-[#FAFAF8] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Send className={cn("h-4 w-4", form.published ? "text-[#34C759]" : "text-neutral-400")} />
                <div>
                  <p className="text-[13px] font-semibold text-neutral-800">Publish immediately</p>
                  <p className="text-[11.5px] text-neutral-500">
                    {form.published ? "Goes live on #/digest when saved" : "Saved as a private draft"}
                  </p>
                </div>
              </div>
              <Switch
                checked={form.published}
                onCheckedChange={(v) => setForm((f) => ({ ...f, published: v }))}
                aria-label="Publish immediately"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving} className="rounded-xl">
              Cancel
            </Button>
            <Button onClick={() => void save()} disabled={saving} className={`rounded-xl px-5 ${GOLD_BTN}`}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
              {editing ? "Save changes" : form.published ? "Publish post" : "Save draft"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[16px]">Delete this post?</AlertDialogTitle>
            <AlertDialogDescription className="text-[13px]">
              &quot;{deleteTarget?.title}&quot; will be removed from the public digest. This cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void doDelete();
              }}
              className="rounded-xl bg-[#FF3B30] text-white hover:bg-[#E0342A]"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
