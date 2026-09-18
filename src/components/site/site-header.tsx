"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { waLink } from "@/lib/business";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BadgePercent, BarChart3, Heart, Home, KeyRound, Mail, Menu, Newspaper, Search, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { View } from "@/lib/store";
import { Logo } from "@/components/site/logo";
import { WhatsAppIcon } from "@/components/site/whatsapp-button";

const NAV: { label: string; view: View; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "Home", view: { name: "home" }, icon: Home },
  { label: "Listings", view: { name: "properties" }, icon: KeyRound },
  { label: "Insights", view: { name: "insights" }, icon: BarChart3 },
  { label: "Digest", view: { name: "digest" }, icon: Newspaper },
  { label: "About", view: { name: "about" }, icon: Users },
  { label: "Contact", view: { name: "contact" }, icon: Mail },
];

const WA_GREETING =
  "Hi City Line Property! I'd like help with a property in Etihad Town, Lahore.";

export function SiteHeader() {
  const { view, navigate, favorites, currency, toggleCurrency, setPalette } = useAppStore();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const switchCurrency = () => {
    const next = toggleCurrency();
    toast.success(
      next === "USD" ? "Prices now shown in USD" : "Prices now shown in PKR",
      { description: next === "USD" ? "Converted at a fixed ₨278 / $ rate" : "Crore / Lakh numbering restored" }
    );
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (v: View) => {
    setOpen(false);
    navigate(v);
  };

  return (
    <header className="sticky top-0 z-50 w-full px-3 pt-3 sm:px-4 print:hidden">
      {/* Floating frosted-glass dock */}
      <motion.div
        animate={{ height: scrolled ? 54 : 64 }}
        transition={{ type: "spring", stiffness: 280, damping: 30 }}
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-full border px-3 transition-[background-color,border-color,box-shadow] duration-300 sm:px-4",
          scrolled
            ? "border-[rgba(60,60,67,0.14)] bg-white/75 shadow-[0_12px_36px_-16px_rgba(154,123,26,0.4)] backdrop-blur-xl saturate-150"
            : "border-white/50 bg-white/55 backdrop-blur-xl saturate-150"
        )}
      >
        {/* Logo + 1% commission badge */}
        <button
          onClick={() => go({ name: "home" })}
          className="flex shrink-0 items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="City Line Property — home"
        >
          <Logo size="sm" withWordmark />
          <span className="hidden items-center gap-1 rounded-full border border-[#E9CE7A]/80 bg-gradient-to-r from-[#FBF3DC] to-[#F5EDD7] px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.08em] text-[#8C6D1F] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:inline-flex">
            <BadgePercent className="h-3 w-3 text-[#C9A227]" aria-hidden />
            1% Commission
          </span>
        </button>

        {/* Desktop nav — gold active pill */}
        <nav className="hidden items-center md:flex" aria-label="Main navigation">
          {NAV.map((item) => {
            const active = view.name === item.view.name;
            return (
              <button
                key={item.label}
                onClick={() => go(item.view)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-3.5 py-2 text-[13.5px] font-medium transition-colors",
                  active ? "text-[#8C6D1F]" : "text-[#6F6A5C] hover:text-[#201B10]"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-pill"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.55 }}
                    className="absolute inset-0 rounded-full bg-[#F5EDD7] ring-1 ring-[#C9A227]/25"
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick find (⌘K) */}
          <button
            onClick={() => setPalette(true)}
            className="hidden h-9 items-center gap-2 rounded-full border border-[rgba(60,60,67,0.14)] bg-white/70 pl-3 pr-2 text-[12.5px] text-[#8E8E93] transition-colors hover:border-[#C9A227]/40 hover:text-[#6F6A5C] lg:flex"
            aria-label="Quick find (Command K)"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden xl:inline">Quick find</span>
            <kbd className="hidden rounded-md border border-[rgba(60,60,67,0.14)] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#8E8E93] xl:inline">
              ⌘K
            </kbd>
          </button>

          {/* Currency toggle */}
          <div
            className="hidden h-9 items-center rounded-full border border-[rgba(60,60,67,0.14)] bg-white/70 p-0.5 sm:flex"
            role="group"
            aria-label="Display currency"
          >
            {(["PKR", "USD"] as const).map((c) => (
              <button
                key={c}
                onClick={() => {
                  if (c !== currency) switchCurrency();
                }}
                aria-pressed={currency === c}
                className={cn(
                  "h-8 rounded-full px-2.5 text-[11px] font-semibold tracking-wide transition-all",
                  currency === c
                    ? "gold-gradient text-white shadow-[0_2px_8px_-2px_rgba(154,123,26,0.6)]"
                    : "text-[#8E8E93] hover:text-[#201B10]"
                )}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Saved */}
          <button
            onClick={() => go({ name: "saved" })}
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-full transition-colors",
              view.name === "saved"
                ? "bg-[#F5EDD7] text-[#8C6D1F]"
                : "text-[#6F6A5C] hover:bg-white/70 hover:text-[#201B10]"
            )}
            aria-label={`Saved properties (${favorites.length})`}
          >
            <Heart
              className={cn(
                "h-[18px] w-[18px]",
                favorites.length > 0 && "fill-[#FF2D55] text-[#FF2D55]"
              )}
            />
            {favorites.length > 0 && (
              <span className="gold-gradient absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white shadow-sm">
                {favorites.length > 9 ? "9+" : favorites.length}
              </span>
            )}
          </button>

          {/* WhatsApp compact */}
          <a
            href={waLink(WA_GREETING)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_6px_18px_-6px_rgba(37,211,102,0.6)] transition-transform hover:scale-105 sm:flex"
            aria-label="Chat with us on WhatsApp"
          >
            <WhatsAppIcon className="h-4 w-4" />
          </a>

          {/* CTA */}
          <Button
            onClick={() => go({ name: "contact" })}
            className="gold-gradient hidden h-9 rounded-full px-4 text-[13px] font-semibold text-white shadow-[0_8px_22px_-8px_rgba(201,162,39,0.75)] hover:opacity-95 lg:inline-flex"
          >
            Post Requirement
          </Button>

          {/* Mobile menu — iOS bottom sheet */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-white/70 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-3xl border-t border-[rgba(60,60,67,0.14)] bg-white px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-0 sm:px-6"
            >
              <SheetTitle className="sr-only">Menu</SheetTitle>

              {/* Grabber */}
              <div
                aria-hidden
                className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-[rgba(60,60,67,0.22)]"
              />

              <div className="flex flex-col gap-4 pt-3">
                {/* Logo + badge */}
                <div className="flex items-center justify-between">
                  <Logo size="sm" withWordmark />
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#E9CE7A]/80 bg-gradient-to-r from-[#FBF3DC] to-[#F5EDD7] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#8C6D1F]">
                    <BadgePercent className="h-3 w-3 text-[#C9A227]" aria-hidden />
                    1% Commission
                  </span>
                </div>

                {/* Quick find */}
                <button
                  onClick={() => {
                    setOpen(false);
                    setPalette(true);
                  }}
                  className="flex items-center gap-2.5 rounded-2xl border border-[rgba(60,60,67,0.14)] bg-[#F6F4EE] px-4 py-3 text-left text-[15px] font-medium text-[#8E8E93]"
                >
                  <Search className="h-4 w-4" />
                  Quick find
                  <kbd className="ml-auto rounded-md border border-[rgba(60,60,67,0.14)] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#8E8E93]">
                    ⌘K
                  </kbd>
                </button>

                {/* Nav */}
                <nav className="flex flex-col gap-1" aria-label="Mobile navigation">
                  {NAV.map((item) => {
                    const active = view.name === item.view.name;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        onClick={() => go(item.view)}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-[15px] font-medium transition-colors",
                          active
                            ? "bg-[#F5EDD7] font-semibold text-[#8C6D1F]"
                            : "text-[#3F3828] hover:bg-[#F4F1E8]"
                        )}
                      >
                        <Icon
                          className={cn("h-4 w-4", active ? "text-[#C9A227]" : "text-[#8E8E93]")}
                        />
                        {item.label}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => go({ name: "saved" })}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-left text-[15px] font-medium text-[#3F3828] hover:bg-[#F4F1E8]"
                  >
                    <span className="flex items-center gap-3">
                      <Heart
                        className={cn(
                          "h-4 w-4",
                          favorites.length > 0 ? "fill-[#FF2D55] text-[#FF2D55]" : "text-[#8E8E93]"
                        )}
                      />
                      Saved
                    </span>
                    <span className="rounded-full bg-[#F5EDD7] px-2 py-0.5 text-[11px] font-semibold text-[#8C6D1F]">
                      {favorites.length}
                    </span>
                  </button>
                </nav>

                {/* Currency */}
                <div className="flex items-center justify-between rounded-2xl bg-[#F6F4EE] px-4 py-3">
                  <span className="text-[13px] font-medium text-[#6F6A5C]">Currency</span>
                  <div
                    className="flex h-8 items-center rounded-full border border-[rgba(60,60,67,0.14)] bg-white p-0.5"
                    role="group"
                    aria-label="Display currency"
                  >
                    {(["PKR", "USD"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          if (c !== currency) switchCurrency();
                        }}
                        aria-pressed={currency === c}
                        className={cn(
                          "h-7 rounded-full px-3 text-[11px] font-semibold transition-all",
                          currency === c
                            ? "gold-gradient text-white shadow-sm"
                            : "text-[#8E8E93] hover:text-[#201B10]"
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CTA + WhatsApp row */}
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <Button
                    onClick={() => go({ name: "contact" })}
                    className="gold-gradient h-11 rounded-full text-[14px] font-semibold text-white shadow-[0_10px_26px_-10px_rgba(201,162,39,0.8)] hover:opacity-95"
                  >
                    Post Requirement
                  </Button>
                  <a
                    href={waLink(WA_GREETING)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_20px_-8px_rgba(37,211,102,0.7)]"
                    aria-label="Chat with us on WhatsApp"
                  >
                    <WhatsAppIcon className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </motion.div>
    </header>
  );
}
