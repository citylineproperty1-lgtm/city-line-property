"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAppStore } from "@/lib/store";
import { waLink } from "@/lib/business";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { BadgePercent, Heart, Home, KeyRound, Mail, MapPin, Menu, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { View } from "@/lib/store";
import { Logo } from "@/components/site/logo";
import { WhatsAppIcon } from "@/components/site/whatsapp-button";

const NAV: { label: string; view: View; icon: React.ComponentType<{ className?: string }> }[] = [
  { label: "Home", view: { name: "home" }, icon: Home },
  { label: "Listings", view: { name: "properties" }, icon: KeyRound },
  { label: "Areas", view: { name: "areas" }, icon: MapPin },
  { label: "About", view: { name: "about" }, icon: Users },
  { label: "Contact", view: { name: "contact" }, icon: Mail },
];

const WA_GREETING =
  "Hi City Line Property! I'd like help with a property in Etihad Town, Lahore.";

export function SiteHeader() {
  const { view, navigate, favorites } = useAppStore();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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
            ? "border-black/10 bg-white/85 shadow-[0_12px_36px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl saturate-150"
            : "border-black/5 bg-white/65 backdrop-blur-xl saturate-150"
        )}
      >
        {/* Logo + 1% commission badge */}
        <button
          onClick={() => go({ name: "home" })}
          className="flex shrink-0 items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="City Line Property — home"
        >
          <Logo size="sm" withWordmark />
          <span className="hidden items-center gap-1 rounded-full border border-[#0F766E]/20 bg-[#E7F4F0] px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.08em] text-[#0B6B5D] sm:inline-flex">
            <BadgePercent className="h-3 w-3 text-[#0F766E]" aria-hidden />
            1% Commission
          </span>
        </button>

        {/* Desktop nav — emerald active pill */}
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
                  active ? "text-[#0B6B5D]" : "text-[#64707C] hover:text-[#0C1210]"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-pill"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.55 }}
                    className="absolute inset-0 rounded-full bg-[#E7F4F0] ring-1 ring-[#0F766E]/20"
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Saved */}
          <button
            onClick={() => go({ name: "saved" })}
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-full transition-colors",
              view.name === "saved"
                ? "bg-[#E7F4F0] text-[#0B6B5D]"
                : "text-[#64707C] hover:bg-white/80 hover:text-[#0C1210]"
            )}
            aria-label={`Saved properties (${favorites.length})`}
          >
            <Heart
              className={cn(
                "h-[18px] w-[18px]",
                favorites.length > 0 && "fill-[#E5484D] text-[#E5484D]"
              )}
            />
            {favorites.length > 0 && (
              <span className="brand-gradient absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold text-white shadow-sm">
                {favorites.length > 9 ? "9+" : favorites.length}
              </span>
            )}
          </button>

          {/* WhatsApp compact */}
          <a
            href={waLink(WA_GREETING)}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-9 w-9 items-center justify-center rounded-full bg-[#22C55E] text-white shadow-[0_6px_18px_-6px_rgba(34,197,94,0.55)] transition-transform hover:scale-105 sm:flex"
            aria-label="Chat with us on WhatsApp"
          >
            <WhatsAppIcon className="h-4 w-4" />
          </a>

          {/* CTA */}
          <Button
            onClick={() => go({ name: "contact" })}
            className="brand-gradient hidden h-9 rounded-full px-4 text-[13px] font-semibold text-white shadow-[0_8px_22px_-8px_rgba(15,118,110,0.7)] hover:opacity-95 lg:inline-flex"
          >
            Post Requirement
          </Button>

          {/* Mobile menu — bottom sheet */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full hover:bg-white/80 md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="rounded-t-3xl border-t border-black/10 bg-white px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-0 sm:px-6"
            >
              <SheetTitle className="sr-only">Menu</SheetTitle>

              {/* Grabber */}
              <div
                aria-hidden
                className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-[rgba(15,23,42,0.18)]"
              />

              <div className="flex flex-col gap-4 pt-3">
                {/* Logo + badge */}
                <div className="flex items-center justify-between">
                  <Logo size="sm" withWordmark />
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#0F766E]/20 bg-[#E7F4F0] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#0B6B5D]">
                    <BadgePercent className="h-3 w-3 text-[#0F766E]" aria-hidden />
                    1% Commission
                  </span>
                </div>

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
                            ? "bg-[#E7F4F0] font-semibold text-[#0B6B5D]"
                            : "text-[#1F2937] hover:bg-[#F4F6F5]"
                        )}
                      >
                        <Icon
                          className={cn("h-4 w-4", active ? "text-[#0F766E]" : "text-[#64707C]")}
                        />
                        {item.label}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => go({ name: "saved" })}
                    className="flex items-center justify-between rounded-2xl px-4 py-3 text-left text-[15px] font-medium text-[#1F2937] hover:bg-[#F4F6F5]"
                  >
                    <span className="flex items-center gap-3">
                      <Heart
                        className={cn(
                          "h-4 w-4",
                          favorites.length > 0 ? "fill-[#E5484D] text-[#E5484D]" : "text-[#64707C]"
                        )}
                      />
                      Saved
                    </span>
                    <span className="rounded-full bg-[#E7F4F0] px-2 py-0.5 text-[11px] font-semibold text-[#0B6B5D]">
                      {favorites.length}
                    </span>
                  </button>
                </nav>

                {/* CTA + WhatsApp row */}
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <Button
                    onClick={() => go({ name: "contact" })}
                    className="brand-gradient h-11 rounded-full text-[14px] font-semibold text-white shadow-[0_10px_26px_-10px_rgba(15,118,110,0.75)] hover:opacity-95"
                  >
                    Post Requirement
                  </Button>
                  <a
                    href={waLink(WA_GREETING)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-[#22C55E] text-white shadow-[0_8px_20px_-8px_rgba(34,197,94,0.65)]"
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
