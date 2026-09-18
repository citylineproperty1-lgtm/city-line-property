"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Heart, Menu, Building2 } from "lucide-react";
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
  const { view, navigate, favorites } = useAppStore();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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
                className={cn(
                  "rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900"
                )}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
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
