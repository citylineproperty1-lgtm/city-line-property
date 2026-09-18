"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Heart, Menu, Building2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { View } from "@/lib/store";

const NAV: { label: string; view: View }[] = [
  { label: "Home", view: { name: "home" } },
  { label: "Properties", view: { name: "properties" } },
  { label: "Insights", view: { name: "insights" } },
  { label: "About", view: { name: "about" } },
  { label: "Contact", view: { name: "contact" } },
];

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
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const go = (v: View) => {
    setOpen(false);
    navigate(v);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-300",
        scrolled
          ? "border-neutral-200/80 bg-white/85 backdrop-blur-xl"
          : "border-transparent bg-white/0"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => go({ name: "home" })}
          className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-neutral-300 rounded-lg"
          aria-label="City Line Property — home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white">
            <Building2 className="h-4 w-4" strokeWidth={2} />
          </span>
          <span className="flex flex-col items-start leading-none">
            <span className="text-[15px] font-semibold tracking-tight text-neutral-900">
              City Line
            </span>
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">
              Property
            </span>
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Main navigation">
          {NAV.map((item) => {
            const active = view.name === item.view.name;
            return (
              <button
                key={item.label}
                onClick={() => go(item.view)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "text-neutral-900"
                    : "text-neutral-500 hover:text-neutral-900"
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active-pill"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.55 }}
                    className="absolute inset-0 rounded-full bg-neutral-100"
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Quick find (⌘K) */}
          <button
            onClick={() => setPalette(true)}
            className="group hidden h-10 items-center gap-2 rounded-full border border-neutral-200 bg-white pl-3 pr-2 text-[13px] text-neutral-400 transition-colors hover:border-neutral-300 hover:text-neutral-600 md:flex lg:pl-3.5 lg:pr-2.5"
            aria-label="Quick find (Command K)"
          >
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline">Quick find</span>
            <kbd className="hidden rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500 lg:inline">
              ⌘K
            </kbd>
          </button>

          {/* Currency toggle */}
          <div
            className="flex h-9 items-center rounded-full border border-neutral-200 bg-white p-0.5"
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
                  "h-8 rounded-full px-2.5 text-[11px] font-semibold tracking-wide transition-colors",
                  currency === c
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-400 hover:text-neutral-900"
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
              "relative hidden h-10 w-10 items-center justify-center rounded-full transition-colors sm:flex",
              view.name === "saved"
                ? "bg-neutral-100 text-neutral-900"
                : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
            )}
            aria-label={`Saved properties (${favorites.length})`}
          >
            <Heart
              className={cn("h-[18px] w-[18px]", favorites.length > 0 && "fill-rose-500 text-rose-500")}
            />
            {favorites.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-white">
                {favorites.length > 9 ? "9+" : favorites.length}
              </span>
            )}
          </button>

          <Button
            onClick={() => go({ name: "contact" })}
            className="hidden h-10 rounded-full bg-neutral-900 px-5 text-sm font-medium text-white shadow-none hover:bg-neutral-700 sm:inline-flex"
          >
            Book a valuation
          </Button>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 border-neutral-200 p-0">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex h-full flex-col">
                <div className="flex items-center gap-2 border-b border-neutral-100 px-5 py-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white">
                    <Building2 className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-semibold tracking-tight">City Line Property</span>
                </div>
                <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
                  <button
                    onClick={() => {
                      setOpen(false);
                      setPalette(true);
                    }}
                    className="mb-1 flex items-center gap-2.5 rounded-xl border border-neutral-200 px-4 py-3 text-left text-[15px] font-medium text-neutral-400"
                  >
                    <Search className="h-4 w-4" />
                    Quick find
                    <kbd className="ml-auto rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-500">
                      ⌘K
                    </kbd>
                  </button>
                  {NAV.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => go(item.view)}
                      className={cn(
                        "rounded-xl px-4 py-3 text-left text-[15px] font-medium transition-colors",
                        view.name === item.view.name
                          ? "bg-neutral-100 text-neutral-900"
                          : "text-neutral-500 hover:bg-neutral-50"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                  <button
                    onClick={() => go({ name: "saved" })}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-left text-[15px] font-medium text-neutral-500 hover:bg-neutral-50"
                  >
                    <span>Saved</span>
                    <span className="flex items-center gap-1.5 text-sm text-neutral-400">
                      <Heart className={cn("h-4 w-4", favorites.length > 0 && "fill-rose-500 text-rose-500")} />
                      {favorites.length}
                    </span>
                  </button>
                  <div className="mt-1 flex items-center justify-between rounded-xl bg-neutral-50 px-4 py-3">
                    <span className="text-[13px] font-medium text-neutral-500">Currency</span>
                    <div className="flex h-8 items-center rounded-full border border-neutral-200 bg-white p-0.5">
                      {(["PKR", "USD"] as const).map((c) => (
                        <button
                          key={c}
                          onClick={() => {
                            if (c !== currency) switchCurrency();
                          }}
                          aria-pressed={currency === c}
                          className={cn(
                            "h-7 rounded-full px-3 text-[11px] font-semibold transition-colors",
                            currency === c
                              ? "bg-neutral-900 text-white"
                              : "text-neutral-400"
                          )}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </nav>
                <div className="mt-auto p-4">
                  <Button
                    onClick={() => go({ name: "contact" })}
                    className="h-11 w-full rounded-full bg-neutral-900 text-sm font-medium hover:bg-neutral-700"
                  >
                    Book a valuation
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
