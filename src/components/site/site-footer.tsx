"use client";

import { useAppStore } from "@/lib/store";
import { AREAS, BUSINESS, telLink } from "@/lib/business";
import { areaSlug } from "@/lib/areas";
import { CATEGORIES } from "@/lib/types";
import {
  ArrowUp,
  BadgePercent,
  Clock,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { Logo } from "@/components/site/logo";

export function SiteFooter() {
  const { navigate, setFilters } = useAppStore();

  const goArea = (area: string) => {
    const slug = areaSlug(area);
    if (slug) navigate({ name: "area", slug });
    else {
      setFilters({ search: area });
      navigate({ name: "properties" });
    }
  };

  const goCategory = (slug: string) => {
    setFilters({ type: slug });
    navigate({ name: "properties" });
  };

  return (
    <footer className="relative mt-auto overflow-hidden bg-[#0C1210] text-[#E6ECEA] print:hidden">
      {/* Subtle emerald wash */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-[#0F1B18] via-[#0C1210] to-[#090D0C]"
      />
      {/* Brand hairline at the very top */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#0F766E]/70 to-transparent"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1.25fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div>
            <Logo size="md" withWordmark tagline tone="dark" />
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-[#0F766E]/50 bg-[#0F766E]/15 px-3 py-1.5 text-[11.5px] font-semibold text-[#7FE0CD]">
              <BadgePercent className="h-3.5 w-3.5 text-[#2DD4BF]" aria-hidden />
              {BUSINESS.commissionLine}
            </div>
            <p className="mt-2.5 text-[13px] font-medium text-[#8FD4C6]">
              {BUSINESS.commissionNote}
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#9BA8A3]">
              Real estate office in Etihad Town, Lahore — direct dealing, no hidden
              margin, no middlemen.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#7FE0CD]">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-[#B9C4C0]">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#2DD4BF]" />
                <span>{BUSINESS.officeAddress}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[#2DD4BF]" />
                <a
                  href={telLink()}
                  className="transition-colors hover:text-[#7FE0CD]"
                >
                  {BUSINESS.phonePrimary}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[#2DD4BF]" />
                <a
                  href={telLink(BUSINESS.telSecondary)}
                  className="transition-colors hover:text-[#7FE0CD]"
                >
                  {BUSINESS.phoneSecondary}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[#2DD4BF]" />
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="break-all transition-colors hover:text-[#7FE0CD]"
                >
                  {BUSINESS.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-[#2DD4BF]" />
                <span>{BUSINESS.hours}</span>
              </li>
            </ul>
          </div>

          {/* Areas */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#7FE0CD]">
              Our areas
            </h3>
            <ul className="mt-4 space-y-2.5">
              {AREAS.map((area) => (
                <li key={area}>
                  <button
                    onClick={() => goArea(area)}
                    className="text-sm text-[#B9C4C0] transition-colors hover:text-[#7FE0CD]"
                  >
                    {area}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#7FE0CD]">
              Categories
            </h3>
            <ul className="mt-4 space-y-2.5">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <button
                    onClick={() => goCategory(cat.slug)}
                    className="text-sm text-[#B9C4C0] transition-colors hover:text-[#7FE0CD]"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Visit us */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#7FE0CD]">
              Visit the office
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-[#B9C4C0]">
              Walk in for on-ground deals, plot visits and instant file transfers —
              we deal directly, you pay 1%.
            </p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=151-C+Etihad+Town+Phase+1+Lahore`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#0F766E]/50 bg-[#0F766E]/15 px-3.5 py-1.5 text-[12.5px] font-semibold text-[#7FE0CD] transition-colors hover:bg-[#0F766E]/25"
            >
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              Get directions
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-[12.5px] text-[#7E8B86] sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} City Line Property. All rights reserved.</span>
          <span>Crafted with care in Lahore · Punjab, Pakistan</span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group flex items-center gap-1.5 rounded-full border border-[#0F766E]/40 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-[#7FE0CD] transition-all hover:border-[#0F766E]/70 hover:bg-[#0F766E]/20"
            aria-label="Back to top"
          >
            Back to top
            <ArrowUp className="h-3 w-3 transition-transform group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
