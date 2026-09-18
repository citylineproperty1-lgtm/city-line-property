"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { HomeView } from "@/components/site/home-view";
import { PropertiesView } from "@/components/site/properties-view";
import { PropertyDetailView } from "@/components/site/property-detail";
import { AgentView } from "@/components/site/agent-view";
import { AboutView } from "@/components/site/about-view";
import { ContactView } from "@/components/site/contact-view";
import { SavedView } from "@/components/site/saved-view";
import { CompareView } from "@/components/site/compare-view";
import { InsightsView } from "@/components/site/insights-view";
import { DigestView } from "@/components/site/digest-view";
import { AdminView } from "@/components/site/admin-view";
import { CompareBarLoader } from "@/components/site/compare-bar";
import { WhatsAppButton } from "@/components/site/whatsapp-button";
import { ScrollProgress } from "@/components/site/scroll-progress";
import { CommandPalette } from "@/components/site/command-palette";
import {
  useAppStore,
  hashToView,
  filtersFromHash,
  sameView,
  type View,
} from "@/lib/store";

const TITLES: Record<string, string> = {
  home: "City Line Property — Your Key to the City | Etihad Town, Lahore",
  properties: "Browse Properties — City Line Property",
  property: "Property Details — City Line Property",
  agent: "Agent Profile — City Line Property",
  about: "About Us — City Line Property",
  contact: "Contact — City Line Property",
  saved: "Saved Properties — City Line Property",
  compare: "Compare Properties — City Line Property",
  insights: "Market Insights — City Line Property",
  digest: "Property Digest — City Line Property",
  admin: "City Line Property",
};

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
            {view.name === "agent" && <AgentView id={view.id} />}
            {view.name === "about" && <AboutView />}
            {view.name === "contact" && <ContactView />}
            {view.name === "saved" && <SavedView />}
            {view.name === "compare" && <CompareView />}
            {view.name === "insights" && <InsightsView />}
            {view.name === "digest" && <DigestView slug={view.slug} />}
            {view.name === "admin" && <AdminView />}
          </motion.div>
        </AnimatePresence>
      </main>
      <SiteFooter />
      <CompareBarLoader />
      <WhatsAppButton />
      <CommandPalette />
    </div>
  );
}
