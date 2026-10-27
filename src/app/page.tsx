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
import { AssistantWidget } from "@/components/site/assistant-widget";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { SplashScreen } from "@/components/site/splash-screen";
import {
  useAppStore,
  viewFromLocation,
  filtersFromHash,
  filtersFromSearch,
  sameView,
  pathForView,
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

const SITE = "https://www.citylineproperty.com.pk";

/** Keep <link rel=canonical> and og:url aligned with the current view.
 *  Server-rendered for real URLs (middleware + generateMetadata); this
 *  covers client-side navigation between views. Property details set their
 *  own canonical when the listing data arrives (see property-detail). */
function setCanonical(path: string) {
  let el = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  const href = `${SITE}${path}`;
  if (el.getAttribute("href") !== href) el.setAttribute("href", href);
  const og = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
  if (og) og.setAttribute("content", href);
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
    // Canonical: real URLs for property/properties; every hash view is a
    // fragment of the homepage — its canonical is "/". The property detail
    // component overrides the canonical with the listing's own URL once its
    // data loads.
    const realPath = pathForView(view);
    setCanonical(realPath ?? "/");
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
    // Hydrate from wherever the URL encodes the view — real path first
    // (/property/<id>, /properties), then the legacy hash form.
    const initial = viewFromLocation();
    applyHashFilters(window.location.hash);
    const searchFilters = filtersFromSearch(window.location.search);
    if (searchFilters) {
      useAppStore.setState((s) => ({
        listingsFilters: { ...s.listingsFilters, ...searchFilters },
      }));
    }
    if (initial && !sameView(initial, useAppStore.getState().view)) {
      useAppStore.setState({ view: initial });
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
    const onPop = () => {
      const next = viewFromLocation();
      applyHashFilters(window.location.hash);
      const popSearch = filtersFromSearch(window.location.search);
      if (popSearch) {
        useAppStore.setState((s) => ({
          listingsFilters: { ...s.listingsFilters, ...popSearch },
        }));
      }
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
      <SplashScreen />
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
      <AssistantWidget />
    </div>
  );
}
