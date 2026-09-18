"use client";

import { useState } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Building2, Mail, MapPin, Phone, Loader2, ArrowRight, ArrowUp } from "lucide-react";
import type { View } from "@/lib/store";

const LINK_GROUPS: {
  title: string;
  links: { label: string; view: View }[];
}[] = [
  {
    title: "Explore",
    links: [
      { label: "Home", view: { name: "home" } },
      { label: "All properties", view: { name: "properties" } },
      { label: "Saved homes", view: { name: "saved" } },
      { label: "About us", view: { name: "about" } },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact", view: { name: "contact" } },
      { label: "Book a valuation", view: { name: "contact" } },
      { label: "Compare properties", view: { name: "compare" } },
    ],
  },
];

export function SiteFooter() {
  const { navigate } = useAppStore();
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

  return (
    <footer className="mt-auto border-t border-neutral-200/80 bg-white pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.3fr]">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 text-white">
                <Building2 className="h-4 w-4" />
              </span>
              <span className="flex flex-col items-start leading-none">
                <span className="text-[15px] font-semibold tracking-tight text-neutral-900">City Line</span>
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">Property</span>
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-neutral-500">
              Karachi&rsquo;s trusted partner for buying, selling and renting premium
              homes and workspaces — with honesty written into every contract.
            </p>
            <ul className="mt-5 space-y-2.5 text-sm text-neutral-500">
              <li className="flex items-center gap-2.5">
                <MapPin className="h-4 w-4 shrink-0 text-neutral-400" />
                14-C Khayaban-e-Ittehad, DHA Phase 6, Karachi
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-neutral-400" />
                <a href="tel:+923001112233" className="transition-colors hover:text-neutral-900">
                  +92 300 111 2233
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-neutral-400" />
                <a href="mailto:hello@citylineproperty.pk" className="transition-colors hover:text-neutral-900">
                  hello@citylineproperty.pk
                </a>
              </li>
            </ul>
          </div>

          {/* Link groups */}
          {LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="text-[13px] font-semibold uppercase tracking-wider text-neutral-900">
                {group.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => navigate(link.view)}
                      className="text-sm text-neutral-500 transition-colors hover:text-neutral-900"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Newsletter */}
          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wider text-neutral-900">
              Property digest
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-neutral-500">
              One email a month — new listings, price trends and honest market notes.
              No spam, ever.
            </p>
            <form onSubmit={subscribe} className="mt-4 flex gap-2">
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-10 flex-1 rounded-full border-neutral-200 bg-neutral-50 px-4 text-sm focus-visible:ring-neutral-300"
                aria-label="Email address"
              />
              <Button
                type="submit"
                disabled={loading}
                className="h-10 w-10 shrink-0 rounded-full bg-neutral-900 p-0 hover:bg-neutral-700"
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

      <div className="border-t border-neutral-100">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-5 text-[13px] text-neutral-400 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} City Line Property. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Crafted with care in Karachi · Sindh, Pakistan</span>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="group flex items-center gap-1.5 rounded-full border border-neutral-200 px-3 py-1.5 text-[12px] font-medium text-neutral-500 transition-all hover:border-neutral-300 hover:bg-neutral-50 hover:text-neutral-900"
              aria-label="Back to top"
            >
              Back to top
              <ArrowUp className="h-3 w-3 transition-transform group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
