"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { HomeView } from "@/components/site/home-view";
import { PropertiesView } from "@/components/site/properties-view";
import { PropertyDetailView } from "@/components/site/property-detail";
import { AboutView } from "@/components/site/about-view";
import { ContactView } from "@/components/site/contact-view";
import { SavedView } from "@/components/site/saved-view";
import { AreasIndexView, AreaDetailView } from "@/components/site/areas-view";
import { AdminView } from "@/components/site/admin-view";
import { ContactBubble } from "@/components/site/contact-bubble";
import { ScrollProgress } from "@/components/site/scroll-progress";
import {
  useAppStore,
  hashToView,
  filtersFromHash,
  sameView,
  type View,
} from "@/lib/store";

const TITLES: Record<string, string> = {
  home: "City Line Property — Real Estate in Etihad Town, Lahore | 1% Commission",
  properties: "Plots, Houses & Apartments for Sale & Rent in Etihad Town, Lahore — City Line Property",
  property: "Property Details — City Line Property",
  about: "About City Line Property — 1% Commission Real Estate Agency, Lahore",
  contact: "Contact City Line Property — Etihad Town Phase 1, Lahore | 0309 4499940",
  saved: "Saved Properties — City Line Property",
  areas: "Area Guides — Etihad Town Phase 1 & 2, Royal Enclave, Premier Enclave, Overseas Block | City Line Property",
  area: "Area Guide — Etihad Town, Lahore | City Line Property",
  admin: "City Line Property — Admin",
};

// Per-view meta description + robots updates (picked up by crawlers that
// render JavaScript, e.g. Googlebot).
const DESCRIPTIONS: Record<string, string> = {
  home: "City Line Property — real estate agency in Etihad Town Phase 1, Lahore. Buy, sell & rent plots, houses & apartments with only 1% commission. Call 0309 4499940.",
  properties: "Browse verified plots, houses, apartments & commercial property for sale and rent in Etihad Town Phase 1 & 2, Royal Enclave, Premier Enclave & Overseas Block, Lahore.",
  property: "Property details — price, area, features & contact for this listing by City Line Property, Etihad Town, Lahore. Only 1% commission.",
  about: "About City Line Property — a trusted property agency at 151-C Etihad Town Phase 1, Lahore, working on a fair 1% commission model with direct dealing.",
  contact: "Contact City Line Property — 151-C Etihad Town Phase 1, Lahore. Call 0309 4499940 or 0321 8422109, or message us on WhatsApp.",
  saved: "Your saved properties at City Line Property — Etihad Town, Lahore.",
  areas: "Area guides for Etihad Town Phase 1 & 2, Royal Enclave, Premier Enclave and Overseas Block, Lahore — prices, amenities & investment outlook.",
  area: "Area guide — property market, amenities & listings for this Etihad Town, Lahore neighbourhood. City Line Property, 1% commission.",
  admin: "City Line Property admin panel.",
};

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("name", name);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function titleFor(view: View): string {
  switch (view.name) {
    case "property":
      return `Property Details — City Line Property`;
    default:
      return TITLES[view.name] ?? TITLES.home;
  }
}

export default function Page() {
  const { view } = useAppStore();

  useEffect(() => {
    document.title = titleFor(view);
    setMeta("description", DESCRIPTIONS[view.name] ?? DESCRIPTIONS.home);
    setMeta("robots", view.name === "admin" ? "noindex, nofollow" : "index, follow");
  }, [view]);

  // Deep links + browser back/forward: hydrate view from URL hash once,
  // then keep the store in sync whenever the user navigates history.
  // Shared /#/properties?… links also restore their listing filters.
  const applyHashFilters = (hash: string) => {
    const f = filtersFromHash(hash);
    if (f) {
      useAppStore.setState((s) => ({
        listingsFilters: { ...s.listingsFilters, ...f },
      }));
    }
  };

  useEffect(() => {
    const initial = hashToView(window.location.hash);
    applyHashFilters(window.location.hash);
    if (initial && !sameView(initial, useAppStore.getState().view)) {
      useAppStore.setState({ view: initial });
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
    const onPop = () => {
      const next = hashToView(window.location.hash);
      applyHashFilters(window.location.hash);
      if (next && !sameView(next, useAppStore.getState().view)) {
        useAppStore.setState({ view: next });
        window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      }
    };
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onPop);
    };
  }, []);

  const viewKey =
    view.name === "property" ? `property-${view.id}` : view.name;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <ScrollProgress />
      <SiteHeader />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewKey}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {view.name === "home" && <HomeView />}
            {view.name === "properties" && <PropertiesView />}
            {view.name === "property" && <PropertyDetailView id={view.id} />}
            {view.name === "about" && <AboutView />}
            {view.name === "contact" && <ContactView />}
            {view.name === "saved" && <SavedView />}
            {view.name === "areas" && <AreasIndexView />}
            {view.name === "area" && <AreaDetailView slug={view.slug} />}
            {view.name === "admin" && <AdminView />}
          </motion.div>
        </AnimatePresence>
      </main>
      <SiteFooter />
      <ContactBubble />
    </div>
  );
}
