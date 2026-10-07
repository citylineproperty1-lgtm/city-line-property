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

/** Column heading — white label with a small brand-gradient accent bar. */
function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-white">{children}</h3>
      <div aria-hidden className="brand-gradient mt-2 h-0.5 w-8 rounded-full" />
    </div>
  );
}

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
    <footer className="bg-mesh-dark relative mt-auto overflow-hidden text-neutral-200 print:hidden">
      {/* Brand gradient hairline at the very top */}
      <div aria-hidden className="gradient-hairline absolute inset-x-0 top-0" />

      <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1.25fr_1fr_1fr_1.2fr]">
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
            <FooterHeading>Contact</FooterHeading>
            {/* Key contact info in a frosted dark card */}
            <div className="glass-dark mt-4 rounded-2xl border border-white/10 p-4">
              <ul className="space-y-3 text-sm text-white">
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#2DD4BF]" />
                  <span>{BUSINESS.officeAddress}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-[#2DD4BF]" />
                  <a
                    href={telLink()}
                    className="font-medium transition-colors hover:text-[#5EB9A9]"
                  >
                    {BUSINESS.phonePrimary}
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 shrink-0 text-[#2DD4BF]" />
                  <a
                    href={telLink(BUSINESS.telSecondary)}
                    className="font-medium transition-colors hover:text-[#5EB9A9]"
                  >
                    {BUSINESS.phoneSecondary}
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 shrink-0 text-[#2DD4BF]" />
                  <a
                    href={`mailto:${BUSINESS.email}`}
                    className="break-all font-medium transition-colors hover:text-[#5EB9A9]"
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
          </div>

          {/* Areas */}
          <div>
            <FooterHeading>Our areas</FooterHeading>
            <ul className="mt-4 space-y-2.5">
              {AREAS.map((area) => (
                <li key={area}>
                  <button
                    onClick={() => goArea(area)}
                    className="text-sm text-[#B9C4C0] transition-colors hover:text-[#5EB9A9]"
                  >
                    {area}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <FooterHeading>Categories</FooterHeading>
            <ul className="mt-4 space-y-2.5">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <button
                    onClick={() => goCategory(cat.slug)}
                    className="text-sm text-[#B9C4C0] transition-colors hover:text-[#5EB9A9]"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Visit us */}
          <div>
            <FooterHeading>Visit the office</FooterHeading>
            <p className="mt-4 text-sm leading-relaxed text-[#B9C4C0]">
              Walk in for on-ground deals, plot visits and instant file transfers —
              we deal directly, you pay 1%.
            </p>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=151-C+Etihad+Town+Phase+1+Lahore`}
              target="_blank"
              rel="noopener noreferrer"
              className="sheen mt-3 inline-flex items-center gap-1.5 rounded-full border border-[#0F766E]/50 bg-[#0F766E]/15 px-3.5 py-1.5 text-[12.5px] font-semibold text-[#7FE0CD] transition-colors hover:bg-[#0F766E]/25"
            >
              <MapPin className="h-3.5 w-3.5" aria-hidden />
              Get directions
            </a>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div aria-hidden className="gradient-hairline relative opacity-40" />
      <div className="relative">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-[12.5px] text-white/50 sm:flex-row sm:px-6">
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
