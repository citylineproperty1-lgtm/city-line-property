import { db } from "@/lib/db";

const AREAS = [
  "Etihad Town Phase 1",
  "Etihad Town Phase 2",
  "Royal Enclave",
  "Premier Enclave",
  "Overseas Block",
];

function formatPrice(price: number, status: string): string {
  const n = price.toLocaleString("en-PK");
  return status === "RENT" ? `PKR ${n}/mo` : `PKR ${n}`;
}

/**
 * Server-rendered, crawlable homepage content (rendered inside <SeoGate> so
 * it is removed from the DOM when the visitor navigates to another hash view).
 * Real, visible, useful text — area links and category links deep into the SPA.
 * Never throws — if the database is unavailable the block renders without data.
 */
export async function SeoContent() {
  let categories: { name: string; slug: string }[] = [];
  let featured: { id: string; title: string; price: number; status: string }[] = [];
  let total = 0;
  try {
    const [cats, props, count] = await Promise.all([
      db.category.findMany({
        orderBy: { sortOrder: "asc" },
        select: { name: true, slug: true },
      }),
      db.property.findMany({
        where: { featured: true, published: true },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: { id: true, title: true, price: true, status: true },
      }),
      db.property.count({ where: { published: true } }),
    ]);
    categories = cats;
    featured = props;
    total = count;
  } catch {
    // fall through with empty data — static text below still renders
  }

  return (
    <section
      aria-label="About City Line Property"
      className="border-t border-neutral-200 bg-white"
    >
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl">
          City Line Property — Real Estate Agency in Etihad Town, Lahore
        </h2>
        <div className="mt-4 space-y-3 text-sm leading-relaxed text-neutral-600">
          <p>
            <strong className="font-semibold text-neutral-800">City Line Property</strong> is a
            trusted property dealer and real estate agency located at 151-C Etihad Town Phase 1,
            Lahore. We help clients buy, sell and rent residential plots, commercial plots, houses,
            apartments and commercial property across Etihad Town Phase 1, Etihad Town Phase 2,
            Royal Enclave, Premier Enclave and Overseas Block — with only{" "}
            <strong className="font-semibold text-neutral-800">1% commission</strong>, direct
            dealing and no hidden margin or middlemen.
          </p>
          <p>
            Browse our {total > 0 ? `${total} ` : ""}verified listings or call us at{" "}
            <a href="tel:+923094499940" className="font-medium text-[#0F766E] hover:underline">
              0309 4499940
            </a>{" "}
            /{" "}
            <a href="tel:+923218422109" className="font-medium text-[#0F766E] hover:underline">
              0321 8422109
            </a>{" "}
            — we answer on WhatsApp too.
          </p>
        </div>

        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
              Areas We Cover
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600">
              {AREAS.map((a) => (
                <li key={a}>
                  <a
                    className="transition-colors hover:text-[#0F766E] hover:underline"
                    href={`#/properties?q=${encodeURIComponent(a)}`}
                  >
                    Property in {a}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
              Property Categories
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-neutral-600">
              {categories.map((c) => (
                <li key={c.slug}>
                  <a
                    className="transition-colors hover:text-[#0F766E] hover:underline"
                    href={`#/properties?type=${c.slug}`}
                  >
                    {c.name} in Etihad Town, Lahore
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {featured.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F766E]">
                Featured Listings
              </h3>
              <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                {featured.map((p) => (
                  <li key={p.id}>
                    <a
                      className="transition-colors hover:text-[#0F766E] hover:underline"
                      href={`#/property/${p.id}`}
                    >
                      {p.title} — {formatPrice(p.price, p.status)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <p className="mt-8 border-t border-neutral-200 pt-6 text-xs leading-relaxed text-neutral-500">
          City Line Property · 151-C Etihad Town Phase 1, Lahore, Punjab, Pakistan · Phone 0309
          4499940 · 0321 8422109 · WhatsApp +92 309 4499940 · Open daily 9:00–20:00
        </p>
      </div>
    </section>
  );
}
