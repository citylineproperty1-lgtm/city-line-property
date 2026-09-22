"use client";

/**
 * Property Digest — editorial section (market notes, buying guides, area updates).
 * Two states: feed (featured + grid + tag filter) and article reader.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Clock3,
  Eye,
  Loader2,
  Mail,
  Newspaper,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

interface Post {
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

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

function readMinutes(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

/** Minimal block parser: "## " → heading, numbered lines → list, else paragraph. */
function contentBlocks(content: string): { type: "p" | "h" | "li"; text: string }[] {
  return content
    .split(/\n\n+/)
    .map((raw) => raw.trim())
    .filter(Boolean)
    .flatMap((block) => {
      if (block.startsWith("## ")) return [{ type: "h" as const, text: block.slice(3) }];
      const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
      if (lines.length > 1 && lines.every((l) => /^\d+\.\s/.test(l))) {
        return lines.map((l) => ({ type: "li" as const, text: l.replace(/^\d+\.\s/, "") }));
      }
      return [{ type: "p" as const, text: block.replace(/\n/g, " ") }];
    });
}

export function DigestView({ slug }: { slug?: string }) {
  const { navigate } = useAppStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tag, setTag] = useState<string>("All");
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [loadedArticle, setLoadedArticle] = useState<{ slug: string; post: Post | null }>({
    slug: "",
    post: null,
  });

  // Deep link (view.slug) wins over in-feed selection; loading derived from cache key.
  const activeSlug = slug ?? openSlug;
  const articleLoading = !!activeSlug && loadedArticle.slug !== activeSlug;
  const article = loadedArticle.slug === activeSlug ? loadedArticle.post : null;

  const load = useCallback(() => {
    setError(null);
    fetch("/api/posts?limit=50")
      .then((r) => {
        if (!r.ok) throw new Error("failed");
        return r.json();
      })
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => setError("Could not load the digest. Please try again."));
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 150);
    return () => clearTimeout(t);
  }, [load]);

  const tags = useMemo(
    () => ["All", ...Array.from(new Set(posts.map((p) => p.tag)))],
    [posts]
  );
  const filtered = tag === "All" ? posts : posts.filter((p) => p.tag === tag);
  const [featured, ...rest] = filtered;

  useEffect(() => {
    if (!activeSlug || loadedArticle.slug === activeSlug) return;
    let dead = false;
    fetch(`/api/posts/${activeSlug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((d) => {
        if (!dead) setLoadedArticle({ slug: activeSlug, post: d.post ?? null });
      })
      .catch(() => {
        if (!dead) setLoadedArticle({ slug: activeSlug, post: null });
      });
    return () => {
      dead = true;
    };
  }, [activeSlug, loadedArticle.slug]);

  /** In-feed click: remember the selection (deep-link slug prop takes precedence). */
  const openArticle = (s: string) => {
    setOpenSlug(s);
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const closeArticle = () => {
    setOpenSlug(null);
    if (slug) navigate({ name: "digest" });
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  /* ----------------------------- Article reader ---------------------------- */
  if (activeSlug) {
    return (
      <div className="mx-auto max-w-3xl bg-[#FAF7EF] px-4 py-10 sm:px-6 sm:py-14">
        <button
          onClick={closeArticle}
          className="group mb-8 inline-flex items-center gap-2 rounded-full border border-neutral-200/80 bg-white px-4 py-2 text-[13px] font-medium text-neutral-600 transition-all hover:border-[#C9A227]/40 hover:text-[#8C6D1F]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          All articles
        </button>

        {articleLoading && (
          <div className="flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#C9A227]" />
          </div>
        )}

        {!articleLoading && !article && (
          <div className="rounded-3xl border border-neutral-200/80 bg-white p-10 text-center">
            <Newspaper className="mx-auto h-8 w-8 text-neutral-300" />
            <p className="mt-3 text-[14px] text-neutral-500">
              This article is not available.
            </p>
            <Button
              onClick={closeArticle}
              className={`mt-5 rounded-full px-5 ${"bg-[linear-gradient(180deg,#DCB94F_0%,#C9A227_100%)] text-white hover:brightness-[1.06]"}`}
            >
              Back to the digest
            </Button>
          </div>
        )}

        {!articleLoading && article && (
          <motion.article
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <div className="flex flex-wrap items-center gap-2 text-[12px] text-neutral-500">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5EDD7] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#8C6D1F]">
                <Tag className="h-3 w-3" />
                {article.tag}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5" />
                {formatDate(article.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-3.5 w-3.5" />
                {readMinutes(article.content)} min read
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" />
                {article.views.toLocaleString()}
              </span>
            </div>

            <h1 className="mt-5 text-[26px] font-bold leading-[1.2] tracking-tight text-neutral-900 sm:text-4xl">
              {article.title}
            </h1>
            <p className="mt-4 text-[16px] leading-relaxed text-neutral-500">
              {article.excerpt}
            </p>
            <p className="mt-4 text-[12.5px] font-medium text-neutral-400">
              By {article.author} · City Line Property, Etihad Town Phase 1, Lahore
            </p>

            {article.cover && (
              <div className="relative mt-8 aspect-[16/8] overflow-hidden rounded-3xl border border-neutral-200/70">
                <Image
                  src={article.cover}
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 768px"
                  className="object-cover"
                  priority
                />
              </div>
            )}

            <div className="mt-8">
              {contentBlocks(article.content).map((b, i) =>
                b.type === "h" ? (
                  <h2
                    key={i}
                    className="mt-9 text-[19px] font-bold tracking-tight text-neutral-900 first:mt-0"
                  >
                    {b.text}
                  </h2>
                ) : b.type === "li" ? (
                  <li
                    key={i}
                    className="ml-5 list-decimal text-[15px] leading-[1.85] text-neutral-700 marker:font-semibold marker:text-[#C9A227]"
                  >
                    {b.text}
                  </li>
                ) : (
                  <p
                    key={i}
                    className="mt-4 text-[15px] leading-[1.85] text-neutral-700 first:mt-0"
                  >
                    {b.text}
                  </p>
                )
              )}
            </div>

            {/* Article footer CTA */}
            <div className="mt-10 overflow-hidden rounded-3xl bg-[linear-gradient(135deg,#E9CE7A_0%,#C9A227_55%,#9A7B1A_100%)] p-6 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/85">
                Thinking about a move?
              </p>
              <p className="mt-2 max-w-md text-[17px] font-semibold leading-snug text-white">
                Visit the office at 151-C, Etihad Town Phase 1 — honest advice, flat 1% commission.
              </p>
              <div className="mt-5 flex flex-wrap gap-2.5">
                <Button
                  onClick={() => navigate({ name: "properties" })}
                  className="rounded-full bg-white px-5 text-[13px] font-semibold text-[#8C6D1F] hover:bg-white/90"
                >
                  Browse listings <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => navigate({ name: "contact" })}
                  variant="outline"
                  className="rounded-full border-white/50 bg-transparent px-5 text-[13px] font-semibold text-white hover:bg-white/15"
                >
                  Post a requirement
                </Button>
              </div>
            </div>
          </motion.article>
        )}
      </div>
    );
  }

  /* -------------------------------- Feed ---------------------------------- */
  return (
    <div className="mx-auto max-w-6xl bg-[#FAF7EF] px-4 py-10 sm:px-6 sm:py-14">
      {/* Header */}
      <motion.header {...fadeUp} transition={{ duration: 0.4, ease: "easeOut" }}>
        <p className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-[0.18em] text-[#8C6D1F]">
          <Newspaper className="h-4 w-4" />
          Property Digest
        </p>
        <h1 className="mt-3 max-w-xl text-3xl font-bold leading-[1.1] tracking-tight text-neutral-900 sm:text-[44px]">
          Market notes &amp; <span className="bg-gradient-to-r from-[#E9CE7A] via-[#C9A227] to-[#9A7B1A] bg-clip-text text-transparent">honest guides</span>.
        </h1>
        <p className="mt-4 max-w-lg text-[14.5px] leading-relaxed text-neutral-500">
          Plain-language notes from the Etihad Town office — what prices are doing,
          how commissions really work, and where your budget goes furthest in Lahore.
        </p>
      </motion.header>

      {/* Tag filter */}
      {tags.length > 1 && (
        <div className="mt-7 flex flex-wrap gap-2">
          {tags.map((t) => (
            <button
              key={t}
              onClick={() => setTag(t)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-all",
                t === tag
                  ? "border-[#C9A227]/50 bg-[#F5EDD7] text-[#8C6D1F]"
                  : "border-neutral-200/90 bg-white text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div className="mt-8 rounded-3xl border border-[#FF3B30]/20 bg-[#FF3B30]/[0.04] p-6 text-[13.5px] text-[#C0392B]">
          {error}
        </div>
      )}

      {!error && posts.length === 0 && (
        <div className="mt-10 rounded-3xl border border-neutral-200/80 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-9 w-9 text-neutral-300" />
          <p className="mt-4 text-[15px] font-semibold text-neutral-700">
            The digest is being written
          </p>
          <p className="mt-1.5 text-[13px] text-neutral-400">
            First market notes are on their way — check back soon.
          </p>
        </div>
      )}

      {/* Featured */}
      {!error && featured && (
        <motion.article
          {...fadeUp}
          transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
          className="group mt-8 cursor-pointer overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-shadow hover:shadow-[0_10px_36px_-12px_rgba(201,162,39,0.35)]"
          onClick={() => openArticle(featured.slug)}
        >
          <div className="grid md:grid-cols-[1.05fr_1fr]">
            <div className="relative aspect-[16/9] overflow-hidden md:aspect-auto md:min-h-[300px]">
              {featured.cover ? (
                <Image
                  src={featured.cover}
                  alt={featured.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 560px"
                  className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              ) : (
                <div className="flex h-full min-h-[220px] items-center justify-center bg-[linear-gradient(135deg,#F5EDD7_0%,#EFE4C2_50%,#E9CE7A_100%)]">
                  <Newspaper className="h-12 w-12 text-[#C9A227]/60" />
                </div>
              )}
              <span className="absolute left-4 top-4 rounded-full bg-[linear-gradient(180deg,#DCB94F_0%,#C9A227_100%)] px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-white shadow-sm">
                Latest
              </span>
            </div>
            <div className="flex flex-col p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-neutral-400">
                <span className="rounded-full bg-[#F5EDD7] px-2.5 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.08em] text-[#8C6D1F]">
                  {featured.tag}
                </span>
                <span>{formatDate(featured.createdAt)}</span>
                <span>·</span>
                <span>{readMinutes(featured.content)} min read</span>
              </div>
              <h2 className="mt-4 text-[22px] font-bold leading-[1.22] tracking-tight text-neutral-900 transition-colors group-hover:text-[#8C6D1F] sm:text-[26px]">
                {featured.title}
              </h2>
              <p className="mt-3 line-clamp-3 text-[14px] leading-relaxed text-neutral-500">
                {featured.excerpt}
              </p>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-6 text-[13.5px] font-semibold text-[#8C6D1F]">
                Read the article
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </span>
            </div>
          </div>
        </motion.article>
      )}

      {/* Grid */}
      {!error && rest.length > 0 && (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p, i) => (
            <motion.article
              key={p.id}
              {...fadeUp}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.06 + i * 0.06 }}
              onClick={() => openArticle(p.slug)}
              className="group flex cursor-pointer flex-col overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_30px_-12px_rgba(201,162,39,0.3)]"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100">
                {p.cover ? (
                  <Image
                    src={p.cover}
                    alt={p.title}
                    fill
                    sizes="(max-width: 640px) 100vw, 380px"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.05]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-[linear-gradient(135deg,#F5EDD7_0%,#EFE4C2_100%)]">
                    <Newspaper className="h-9 w-9 text-[#C9A227]/50" />
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-2 text-[11px] text-neutral-400">
                  <span className="rounded-full bg-[#F5EDD7] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#8C6D1F]">
                    {p.tag}
                  </span>
                  <span>{formatDate(p.createdAt)}</span>
                  <span>·</span>
                  <span>{readMinutes(p.content)} min</span>
                </div>
                <h3 className="mt-3 line-clamp-2 text-[16px] font-bold leading-snug tracking-tight text-neutral-900 transition-colors group-hover:text-[#8C6D1F]">
                  {p.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-neutral-500">
                  {p.excerpt}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 pt-4 text-[12.5px] font-semibold text-[#8C6D1F]">
                  Read more
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </motion.article>
          ))}
        </div>
      )}

      {/* Newsletter band */}
      <motion.section
        {...fadeUp}
        transition={{ duration: 0.45, ease: "easeOut", delay: 0.1 }}
        className="mt-12 flex flex-col items-start justify-between gap-5 rounded-3xl border border-[#C9A227]/25 bg-[linear-gradient(135deg,rgba(233,206,122,0.16),rgba(201,162,39,0.10))] p-6 sm:flex-row sm:items-center sm:p-8"
      >
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#DCB94F_0%,#C9A227_100%)] text-white shadow-[0_4px_12px_rgba(201,162,39,0.35)]">
            <Mail className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-[16px] font-bold tracking-tight text-neutral-900">
              One email a month, zero spam
            </h3>
            <p className="mt-1 max-w-md text-[13px] leading-relaxed text-neutral-500">
              New listings, price movements and honest market notes from the
              Etihad Town office — subscribe from the footer below.
            </p>
          </div>
        </div>
        <Button
          onClick={() => navigate({ name: "contact" })}
          className="shrink-0 rounded-full bg-[linear-gradient(180deg,#DCB94F_0%,#C9A227_100%)] px-5 text-[13px] font-semibold text-white shadow-[0_4px_14px_rgba(201,162,39,0.35)] hover:brightness-[1.06]"
        >
          Talk to the office <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.section>

      <AnimatePresence />
    </div>
  );
}
