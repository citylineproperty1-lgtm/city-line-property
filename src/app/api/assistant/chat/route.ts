import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serializeProperty } from "@/lib/serialize";
import { getSessionAdmin, type SessionAdmin } from "@/lib/auth";
import { formatPKR } from "@/lib/format";
import {
  DEFAULT_ENV_MODEL,
  ensureZaiConfig,
  isEnvConfigured,
  isZaiConfigured,
} from "@/lib/zai-config";
import { fallbackAnswer } from "@/lib/assistant-fallback";
import ZAI from "z-ai-web-dev-sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * CLP Assistant — the site's AI agent (voice or typed commands).
 *
 * Visitors can: search listings, ask about a property, get business info.
 * Signed-in admins can ALSO: add listings and remove listings (the agent
 * extracts the fields, the server executes against Prisma).
 *
 * Safety model:
 *  - Every mutation is gated server-side by the clp_admin session — the LLM
 *    cannot mutate anything, it can only REQUEST an action; execution happens
 *    here only when a valid admin cookie is present.
 *  - Removing a listing needs a short-lived single-use confirmation token:
 *    the first call returns the token, the agent reads it to the user, and
 *    the removal only happens when the user confirms and the agent calls the
 *    action again with that exact token.
 *  - Per-IP rate limit keeps the endpoint from being hammered.
 */

const RATE_LIMIT = 30; // requests per minute per IP
const MAX_TOOL_ROUNDS = 3;
const CATEGORIES = [
  "residential-plots",
  "commercial-plots",
  "houses",
  "apartments",
  "commercial-halls",
  "flat-studio",
  "for-rent",
] as const;
const DISTRICTS = [
  "Etihad Town Phase 1",
  "Etihad Town Phase 2",
  "Royal Enclave",
  "Premier Enclave",
  "Overseas Block",
] as const;

/** per-IP rate buckets */
const rateBuckets = new Map<string, { count: number; reset: number }>();

type ChatMsg = { role: "user" | "assistant"; content: string };

// ---------------------------------------------------------------- helpers

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.reset < now) {
    rateBuckets.set(ip, { count: 1, reset: now + 60_000 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > RATE_LIMIT;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function normalizeDistrict(input: string): string {
  const q = input.toLowerCase().trim();
  if (!q) return "";
  const exact = DISTRICTS.find((d) => d.toLowerCase() === q);
  if (exact) return exact;
  // ASR spellings vary wildly ("Etihad" → "ettie hat"/"etehad"...) — check
  // the phase number FIRST, then the society names with loose matching.
  if (/(phase\s*2|phase\s*two)/.test(q)) return "Etihad Town Phase 2";
  if (/(phase\s*1|phase\s*one)/.test(q)) return "Etihad Town Phase 1";
  if (/(etihad|ettie|eta\s*had|etehad|e\s*tihad)/.test(q)) return "Etihad Town Phase 1";
  if (q.includes("royal")) return "Royal Enclave";
  if (q.includes("premier")) return "Premier Enclave";
  if (q.includes("overseas")) return "Overseas Block";
  return input.trim();
}

function normalizeType(input: string): string {
  const q = input.toLowerCase().trim();
  if ((CATEGORIES as readonly string[]).includes(q)) return q;
  if (q.includes("commercial plot")) return "commercial-plots";
  if (q.includes("residential plot")) return "residential-plots";
  if (q.includes("plot")) return "residential-plots";
  if (q.includes("hall")) return "commercial-halls";
  if (q.includes("studio") || q.includes("flat")) return "flat-studio";
  if (q.includes("apartment")) return "apartments";
  if (q.includes("house") || q.includes("home")) return "houses";
  if (q.includes("rent")) return "for-rent";
  return input.trim();
}

/** Very lenient parse: the model may wrap JSON in prose or code fences. */
function extractJson(text: string): Record<string, unknown> | null {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
  } catch {
    /* fall through to brace scan */
  }
  const start = cleaned.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === "{") depth++;
    else if (cleaned[i] === "}") {
      depth--;
      if (depth === 0) {
        try {
          const parsed = JSON.parse(cleaned.slice(start, i + 1));
          if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

function money(n: number): string {
  if (n >= 10_000_000) return `PKR ${(n / 10_000_000).toFixed(2).replace(/0+$/, "").replace(/\.$/, "")} Crore`;
  if (n >= 100_000) return `PKR ${(n / 100_000).toFixed(2).replace(/0+$/, "").replace(/\.$/, "")} Lac`;
  return `PKR ${n.toLocaleString("en-PK")}`;
}

// ---------------------------------------------------------------- actions

async function runSearch(
  args: Record<string, unknown>,
  admin: SessionAdmin | null
): Promise<Record<string, unknown>> {
  const query = String(args.query ?? "").trim();
  const status = String(args.status ?? "").toUpperCase();
  const minPrice = Number(args.minPrice ?? 0) || 0;
  const maxPrice = Number(args.maxPrice ?? 0) || 0;
  // ±15 sqft tolerance absorbs marla→sqft rounding in stored areas
  const minArea = Math.max(0, (Number(args.minArea ?? 0) || 0) - 15);
  const maxAreaTolerance = (Number(args.maxArea ?? 0) || 0) + 15;
  const beds = Number(args.beds ?? 0) || 0;
  const limit = Math.min(Number(args.limit ?? 5) || 5, 8);
  const includeDrafts = admin ? Boolean(args.includeDrafts) : false;
  console.log("[assistant] search args:", JSON.stringify(args));

  const where: Record<string, unknown> = includeDrafts ? {} : { published: true };
  if (status === "SALE" || status === "RENT") where.status = status;
  const type = normalizeType(String(args.type ?? ""));
  if (type && (CATEGORIES as readonly string[]).includes(type)) where.type = type;
  const district = normalizeDistrict(String(args.district ?? ""));
  if (district && (DISTRICTS as readonly string[]).includes(district)) where.district = district;
  if (minPrice > 0 || maxPrice > 0) {
    where.price = {
      ...(minPrice > 0 ? { gte: minPrice } : {}),
      ...(maxPrice > 0 ? { lte: maxPrice } : {}),
    };
  }
  if (minArea > 0) where.area = { gte: minArea };
  if (maxAreaTolerance > 15) {
    where.area = { ...(where.area as object), lte: maxAreaTolerance };
  }
  if (beds > 0) where.beds = { gte: beds };

  const find = (extraText: string | null) =>
    db.property.findMany({
      where: extraText
        ? {
            ...where,
            OR: [
              // case-insensitive: Postgres `contains` is case-sensitive by
              // default, so a needle like "house" missed "3 Marla House"
              { title: { contains: extraText, mode: "insensitive" } },
              { district: { contains: extraText, mode: "insensitive" } },
              { address: { contains: extraText, mode: "insensitive" } },
              { reference: { equals: extraText, mode: "insensitive" } },
              { description: { contains: extraText, mode: "insensitive" } },
            ],
          }
        : where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

  let rows = await find(query || null);
  // Any non-empty needle can kill every row (over-specific or misspelled) —
  // if the text filter matched nothing, retry with the structured filters.
  if (rows.length === 0 && query) {
    rows = await find(null);
  }
  // The model often over-constrains the AREA it invented (e.g. forces
  // "Etihad Town Phase 1" when the user never named a district) — relax it
  // before giving up, matching how a human agent would widen the search.
  if (rows.length === 0 && where.district) {
    rows = await db.property.findMany({
      where: { ...where, district: undefined },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
  return {
    total: rows.length,
    properties: rows.map((p) => ({
      reference: p.reference,
      title: p.title,
      price: p.price,
      priceLabel: money(p.price),
      status: p.status,
      type: p.type,
      district: p.district,
      area: p.area,
      areaMarla: (p.area / 225).toFixed(2),
      beds: p.beds,
      baths: p.baths,
      published: p.published,
      listingState: p.listingState,
      slug: p.slug,
      image: (JSON.parse(p.images) as string[])[0] ?? "",
    })),
  };
}

async function runGet(args: Record<string, unknown>): Promise<Record<string, unknown>> {
  const ref = String(args.reference ?? "").trim();
  const row = await db.property.findFirst({
    where: { OR: [{ reference: { equals: ref } }, { slug: { equals: ref } }] },
  });
  if (!row) return { found: false, note: `No listing found for "${ref}".` };
  return {
    found: true,
    property: {
      reference: row.reference,
      title: row.title,
      price: row.price,
      priceLabel: money(row.price),
      status: row.status,
      type: row.type,
      district: row.district,
      address: row.address,
      area: row.area,
      areaMarla: (row.area / 225).toFixed(2),
      beds: row.beds,
      baths: row.baths,
      description: row.description,
      amenities: JSON.parse(row.amenities),
      published: row.published,
      listingState: row.listingState,
      views: row.views,
      slug: row.slug,
      image: (JSON.parse(row.images) as string[])[0] ?? "",
    },
  };
}

async function runAdd(
  args: Record<string, unknown>,
  admin: SessionAdmin | null
): Promise<Record<string, unknown>> {
  if (!admin) {
    return {
      denied: true,
      note: "Admin sign-in required. Ask the user to sign in from the Admin panel first.",
    };
  }
  const title = String(args.title ?? "").trim();
  const price = Number(args.price ?? 0);
  const status = String(args.status ?? "SALE").toUpperCase();
  const type = normalizeType(String(args.type ?? ""));
  const district = normalizeDistrict(String(args.district ?? ""));
  const area = Math.round(Number(args.area ?? 0) || 0);
  const beds = Math.max(0, Number(args.beds ?? 0) | 0);
  const baths = Math.max(0, Number(args.baths ?? 0) | 0);

  if (!title || title.length < 5) return { error: "Title is required (min 5 chars)." };
  if (!Number.isFinite(price) || price <= 0)
    return { error: "Price must be a positive PKR number." };
  if (status !== "SALE" && status !== "RENT") return { error: "Status must be SALE or RENT." };
  if (!(CATEGORIES as readonly string[]).includes(type))
    return { error: `Type must be one of: ${CATEGORIES.join(", ")}` };
  if (!(DISTRICTS as readonly string[]).includes(district))
    return { error: `District must be one of: ${DISTRICTS.join(", ")}` };

  // Reference = highest existing CLP number + 1 (count-based numbering
  // collides whenever a listing was ever deleted — real bug we hit in QA).
  const refs = await db.property.findMany({ select: { reference: true } });
  let maxRef = 100;
  for (const r of refs) {
    const m = /^CLP-(\d+)$/.exec(r.reference);
    if (m) maxRef = Math.max(maxRef, Number(m[1]));
  }
  let row: { reference: string; title: string; price: number } | null = null;
  for (let attempt = 0; attempt < 5 && !row; attempt++) {
    try {
      row = await db.property.create({
        data: {
          title,
          slug: `${slugify(title)}-${Math.random().toString(36).slice(2, 6)}`,
          reference: `CLP-${maxRef + 1 + attempt}`,
          description: String(args.description ?? "").trim() || title,
          price,
          status,
          type,
          beds,
          baths,
          area,
          address: String(args.address ?? "").trim() || district,
          city: "Lahore",
          district,
          images: JSON.stringify([]),
          amenities: JSON.stringify([]),
          featured: false,
          published: true,
          listingState: "AVAILABLE",
          yearBuilt: new Date().getFullYear(),
          parking: "",
        },
      });
    } catch (e) {
      if (
        e &&
        typeof e === "object" &&
        "code" in e &&
        (e as { code?: string }).code === "P2002"
      ) {
        continue; // reference race — try the next number
      }
      throw e;
    }
  }
  if (!row) return { error: "Could not allocate a listing reference — try again." };
  return {
    created: true,
    reference: row.reference,
    title: row.title,
    priceLabel: money(row.price),
    note: "Listing is LIVE with no photos yet — photos can be added from the Admin panel.",
  };
}

async function runRemove(
  args: Record<string, unknown>,
  admin: SessionAdmin | null
): Promise<Record<string, unknown>> {
  if (!admin) {
    return {
      denied: true,
      note: "Admin sign-in required. Ask the user to sign in from the Admin panel first.",
    };
  }
  const ref = String(args.reference ?? "").trim();
  const row = await db.property.findFirst({
    where: { OR: [{ reference: { equals: ref } }, { slug: { equals: ref } }] },
  });
  if (!row) return { error: `No listing found for "${ref}".` };

  const token = String(args.confirmToken ?? "").trim();
  // DB-backed pending store — survives serverless instance swaps (the old
  // in-memory Map silently broke confirmations on Vercel when the confirm
  // round hit a different instance).
  const pending = await db.pendingRemoval.findUnique({ where: { reference: row.reference } });

  if (
    !token ||
    !pending ||
    pending.expiresAt.getTime() < Date.now() ||
    pending.token !== token
  ) {
    const fresh = `RM-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 10 * 60_000);
    await db.pendingRemoval.upsert({
      where: { reference: row.reference },
      update: { token: fresh, expiresAt },
      create: { reference: row.reference, token: fresh, expiresAt },
    });
    // Opportunistic cleanup of long-expired confirmations.
    await db.pendingRemoval.deleteMany({ where: { expiresAt: { lt: new Date() } } });
    return {
      needsConfirmation: true,
      confirmToken: fresh,
      listing: {
        reference: row.reference,
        title: row.title,
        priceLabel: money(row.price),
        district: row.district,
      },
      note: "Ask the user to confirm. Removal ONLY happens when this exact token is sent back.",
    };
  }

  await db.property.delete({ where: { id: row.id } });
  await db.pendingRemoval.deleteMany({ where: { reference: row.reference } });
  return { removed: true, reference: row.reference, title: row.title };
}

// ---------------------------------------------------------------- prompt

function systemPrompt(admin: SessionAdmin | null): string {
  return `You are the CLP Assistant — the AI agent of City Line Property, a real-estate agency in Etihad Town, Lahore, Pakistan.
Business facts: 1% commission only; office 151-C Etihad Town Phase 1, Lahore; phones 0309 4499940 and 0321 8422109; open Mon-Sun 10AM-8PM; areas served: Etihad Town Phase 1, Etihad Town Phase 2, Royal Enclave, Premier Enclave, Overseas Block.
Admin signed in: ${
    admin
      ? `YES (${admin.name || admin.email}) — you may add/remove listings for this user.`
      : "NO — mutation actions will be denied; if the user asks to add/remove, tell them to sign in to the Admin panel first."
  }

You MUST answer with ONE JSON object and nothing else. Either:
{"action":"reply","text":"<your answer to the user>"}
or request ONE tool:
{"action":"search_properties","args":{"query":"...","status":"SALE|RENT","type":"<category slug>","district":"...","minPrice":0,"maxPrice":0,"minArea":0,"beds":0,"includeDrafts":false}}
{"action":"get_property","args":{"reference":"CLP-117"}}
{"action":"add_listing","args":{"title":"...","price":93000000,"status":"SALE","type":"commercial-plots","district":"Etihad Town Phase 1","area":2087,"beds":0,"baths":0,"description":"...","address":"..."}}
{"action":"remove_listing","args":{"reference":"CLP-105","confirmToken":"RM-XXXX"}}

Category slugs: ${CATEGORIES.join(", ")}.
In search_properties, "query" must be a SHORT keyword (1-2 words, e.g. "corner", "commercial") or empty — put sizes/prices/areas in the numeric filters, never in query.
Only pass "district" when the USER actually named that area. If they did not name one, leave district empty — a wrong district makes the search find nothing.
Conversions you must do yourself: 1 marla = 225 sqft (so "5 marla" area = 1125); 1 lac/lakh = 100,000 PKR; 1 crore = 10,000,000 PKR ("9 crore 30 lac" = 93000000; "1.5 crore" = 15000000).
Rules:
- NEVER invent listings or prices — use tools for anything about inventory.
- To REMOVE a listing: call remove_listing WITHOUT confirmToken first; you will receive a token (e.g. RM-4F7K); tell the user to reply "YES <token>" to confirm; only call remove_listing WITH that exact token after the user confirms.
- When the user replies with a confirmation token (e.g. "YES RM-4F7K"), you MUST call remove_listing with reference + confirmToken — never answer from memory. NEVER claim a listing was added or removed unless your LAST [TOOL_RESULT] showed created:true or removed:true; if the tool returned an error or a new token request, report exactly that instead.
- To ADD a listing: you need at least title, price and type+district; ask for missing pieces; create it only when you have the required fields (status defaults SALE; convert marla to sqft for area).
- After a tool result, continue: either request ONE more tool or send the final reply. NEVER call the same tool twice in a row — after you see a [TOOL_RESULT], your next output must be the final {"action":"reply"} answer.
- Keep the reply short, friendly, simple English (or the user's language), max ~90 words.
- For listings found, mention reference codes like CLP-117 and prices in Lac/Crore.`;
}

// ---------------------------------------------------------------- route

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests — slow down a little." },
      { status: 429 }
    );
  }

  let message = "";
  let history: ChatMsg[] = [];
  try {
    const body = await req.json();
    message = String(body.message ?? "").slice(0, 2000);
    history = Array.isArray(body.history)
      ? body.history
          .filter(
            (m: unknown): m is ChatMsg =>
              !!m &&
              typeof m === "object" &&
              typeof (m as ChatMsg).role === "string" &&
              typeof (m as ChatMsg).content === "string"
          )
          .slice(-12)
      : [];
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }
  if (!message.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const admin = await getSessionAdmin();

  // No AI config (or QA override)? Answer with the offline brain — search,
  // details and business info still work for visitors, zero cost, zero
  // secrets. Mutations politely point at the Admin panel.
  if (!(await isZaiConfigured())) {
    const fb = await fallbackAnswer(message);
    return NextResponse.json({ reply: fb.reply, properties: fb.properties, admin: !!admin, action: fb.action });
  }

  try {
    await ensureZaiConfig();
    const zai = await ZAI.create();
    const messages: ChatMsg[] = [
      { role: "assistant", content: systemPrompt(admin) },
      ...history,
      { role: "user", content: message },
    ];

    let lastAction = "";
    let repeatedAction = false;
    const collected: ReturnType<typeof serializeProperty>[] = [];

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      // Upstream LLM occasionally 429s under load — retry with backoff.
      let completion;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          completion = await zai.chat.completions.create({
            // The public Z.ai API (Vercel env-config mode) requires an
            // explicit model; the sandbox internal gateway has a server
            // default and must stay untouched.
            ...(isEnvConfigured()
              ? { model: process.env.ZAI_MODEL || DEFAULT_ENV_MODEL }
              : {}),
            messages,
            thinking: { type: "disabled" },
          });
          break;
        } catch (err) {
          const isRate =
            err instanceof Error && /429|rate/i.test(err.message);
          if (attempt === 3 || !isRate) throw err;
          await new Promise((r) => setTimeout(r, 1500 * attempt));
        }
      }
      const raw = completion.choices[0]?.message?.content ?? "";
      const parsed = extractJson(raw);

      if (!parsed || typeof parsed.action !== "string") {
        // model answered in prose — pass it through as the reply
        if (raw.trim()) {
          return NextResponse.json({
            reply: raw.trim(),
            properties: collected,
            admin: !!admin,
          });
        }
        return NextResponse.json({
          reply:
            "Sorry, I did not understand that. Try: “3 marla plot in Etihad Phase 1” or “add listing”.",
          properties: collected,
          admin: !!admin,
        });
      }

      const action = String(parsed.action);
      console.log(`[assistant] round ${round} action=${action} admin=${!!admin}`);
      const args =
        parsed.args && typeof parsed.args === "object"
          ? (parsed.args as Record<string, unknown>)
          : {};

      if (action === "reply") {
        return NextResponse.json({
          reply: String(parsed.text ?? "").trim() || "Done.",
          properties: collected,
          admin: !!admin,
          action: lastAction || undefined,
        });
      }

      lastAction = action;
      let result: Record<string, unknown>;
      if (repeatedAction) {
        // The model already ran this exact action — do NOT run it again.
        // Force it to answer with what it has.
        result = {
          note: "You already ran this action and have the results above. You MUST now send the final answer as {\"action\":\"reply\",\"text\":\"...\"} — do not call any tool again.",
        };
      } else {
        repeatedAction = true;
        try {
          if (action === "search_properties") result = await runSearch(args, admin);
          else if (action === "get_property") result = await runGet(args);
          else if (action === "add_listing") result = await runAdd(args, admin);
          else if (action === "remove_listing") result = await runRemove(args, admin);
          else result = { error: `Unknown action "${action}".` };
        } catch (e) {
          console.error("assistant action", action, e);
          result = { error: "The action failed — please try again." };
        }
      }

      // attach full card data for the frontend
      if (action === "search_properties" && Array.isArray(result.properties)) {
        const refs = (result.properties as Array<{ reference?: string }>)
          .map((p) => p.reference)
          .filter(Boolean) as string[];
        if (refs.length) {
          const rows = await db.property.findMany({ where: { reference: { in: refs } } });
          collected.length = 0;
          collected.push(...rows.map(serializeProperty));
        }
      } else if (action === "get_property" && result.found) {
        const ref = (result.property as { reference?: string }).reference;
        const row = ref
          ? await db.property.findFirst({ where: { reference: ref } })
          : null;
        if (row) {
          collected.length = 0;
          collected.push(serializeProperty(row));
        }
      }

      // compact summary for the model (keeps tokens small)
      const brief =
        action === "search_properties"
          ? {
              total: result.total,
              note: result.note,
              error: result.error,
              properties: (result.properties as Array<Record<string, unknown>> | undefined)?.map(
                (p) => ({
                  reference: p.reference,
                  title: p.title,
                  priceLabel: p.priceLabel,
                  district: p.district,
                  type: p.type,
                  status: p.status,
                  listingState: p.listingState,
                })
              ),
            }
          : result;

      messages.push({ role: "assistant", content: JSON.stringify(parsed) });
      messages.push({
        role: "user",
        content: `[TOOL_RESULT] ${action}: ${JSON.stringify(brief)}`,
      });
    }

    // Rounds exhausted — if searches already produced cards, summarise them
    // instead of failing; the user still gets a useful answer.
    if (collected.length) {
      const lines = collected
        .slice(0, 4)
        .map((p) => `• ${p.reference}: ${p.title} — ${formatPKR(p.price)}`);
      return NextResponse.json({
        reply: `Here's what I found:\n${lines.join("\n")}\n\nAsk me about any of these for full details.`,
        properties: collected,
        admin: !!admin,
        action: lastAction || undefined,
      });
    }
    return NextResponse.json({
      reply: "I could not finish that request — please rephrase it.",
      properties: collected,
      admin: !!admin,
      action: lastAction || undefined,
    });
  } catch (e) {
    // AI configured but broken (SDK/network/quota)? Degrade to the offline
    // brain so visitors still get an answer instead of a dead end.
    console.error("POST /api/assistant/chat", e);
    try {
      const fb = await fallbackAnswer(message);
      return NextResponse.json({ reply: fb.reply, properties: fb.properties, admin: !!admin, action: fb.action });
    } catch (fbError) {
      console.error("assistant fallback also failed", fbError);
      return NextResponse.json(
        { error: "The assistant is unavailable right now — please try again." },
        { status: 500 }
      );
    }
  }
}
