"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { AREAS, BUSINESS, telLink } from "@/lib/business";
import { CATEGORIES } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowUp,
  BadgePercent,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import { Logo } from "@/components/site/logo";

export function SiteFooter() {
  const { navigate, setFilters } = useAppStore();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Subscription failed");
      toast.success("You're on the list!", {
        description: "New listings and market insights, straight to your inbox.",
      });
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Subscription failed");
    } finally {
      setLoading(false);
    }
  };

  const goArea = (area: string) => {
    setFilters({ search: area });
    navigate({ name: "properties" });
  };

  const goCategory = (slug: string) => {
    setFilters({ type: slug });
    navigate({ name: "properties" });
  };

  return (
    <footer className="relative mt-auto overflow-hidden bg-[#14100A] text-[#E8E2D4] print:hidden">
      {/* Deep charcoal-gold gradient wash */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-[#2A2210] via-[#1C1609] to-[#100D06]"
      />
      {/* Gold hairline at the very top */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A227]/70 to-transparent"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.6fr_1.25fr_1fr_1fr_1.4fr]">
          {/* Brand */}
          <div>
            <Logo size="md" withWordmark tagline tone="dark" />
            <div className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-[#C9A227]/35 bg-[#C9A227]/10 px-3 py-1.5 text-[11.5px] font-semibold text-[#E9CE7A]">
              <BadgePercent className="h-3.5 w-3.5 text-[#C9A227]" aria-hidden />
              {BUSINESS.commissionLine}
            </div>
            <p className="mt-2.5 text-[13px] font-medium text-[#C9A227]/90">
              {BUSINESS.commissionNote}
            </p>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#B7B0A0]">
              Real estate office in Etihad Town, Lahore — direct dealing, no hidden
              margin, no middlemen.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#E9CE7A]">
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-[#C7C0AF]">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#C9A227]" />
                <span>{BUSINESS.officeAddress}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[#C9A227]" />
                <a
                  href={telLink()}
                  className="transition-colors hover:text-[#E9CE7A]"
                >
                  {BUSINESS.phonePrimary}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[#C9A227]" />
                <a
                  href={telLink(BUSINESS.telSecondary)}
                  className="transition-colors hover:text-[#E9CE7A]"
                >
                  {BUSINESS.phoneSecondary}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[#C9A227]" />
                <a
                  href={`mailto:${BUSINESS.email}`}
                  className="break-all transition-colors hover:text-[#E9CE7A]"
                >
                  {BUSINESS.email}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 shrink-0 text-[#C9A227]" />
                <span>{BUSINESS.hours}</span>
              </li>
            </ul>
          </div>

          {/* Areas */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#E9CE7A]">
              Our areas
            </h3>
            <ul className="mt-4 space-y-2.5">
              {AREAS.map((area) => (
                <li key={area}>
                  <button
                    onClick={() => goArea(area)}
                    className="text-sm text-[#C7C0AF] transition-colors hover:text-[#E9CE7A]"
                  >
                    {area}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#E9CE7A]">
              Categories
            </h3>
            <ul className="mt-4 space-y-2.5">
              {CATEGORIES.map((cat) => (
                <li key={cat.slug}>
                  <button
                    onClick={() => goCategory(cat.slug)}
                    className="text-sm text-[#C7C0AF] transition-colors hover:text-[#E9CE7A]"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-[#E9CE7A]">
              Property digest
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-[#C7C0AF]">
              One email a month — new listings, price trends and honest market
              notes. No spam, ever.
            </p>
            <button
              onClick={() => navigate({ name: "digest" })}
              className="group mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#E9CE7A] transition-colors hover:text-[#F3E3B2]"
            >
              Read the digest
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
            <form onSubmit={subscribe} className="mt-4 flex gap-2">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-10 flex-1 rounded-full border-white/15 bg-white/5 px-4 text-sm text-[#E8E2D4] placeholder:text-[#8F897B] focus-visible:border-[#C9A227]/50 focus-visible:ring-[#C9A227]/30"
                aria-label="Email address"
              />
              <Button
                type="submit"
                disabled={loading}
                className="gold-gradient h-10 w-10 shrink-0 rounded-full p-0 text-white shadow-[0_8px_22px_-8px_rgba(201,162,39,0.7)] hover:opacity-95"
                aria-label="Subscribe"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-[12.5px] text-[#8F897B] sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} City Line Property. All rights reserved.</span>
          <span>Crafted with care in Lahore · Punjab, Pakistan</span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group flex items-center gap-1.5 rounded-full border border-[#C9A227]/30 bg-white/5 px-3 py-1.5 text-[12px] font-medium text-[#E9CE7A] transition-all hover:border-[#C9A227]/60 hover:bg-[#C9A227]/15"
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
