"use client";

import { AnimatePresence, motion } from "framer-motion";
import { SiteHeader } from "@/components/site/site-header";
import { SiteFooter } from "@/components/site/site-footer";
import { HomeView } from "@/components/site/home-view";
import { PropertiesView } from "@/components/site/properties-view";
import { PropertyDetailView } from "@/components/site/property-detail";
import { AboutView } from "@/components/site/about-view";
import { ContactView } from "@/components/site/contact-view";
import { SavedView } from "@/components/site/saved-view";
import { useAppStore } from "@/lib/store";

export default function Page() {
  const { view } = useAppStore();

  const viewKey =
    view.name === "property" ? `property-${view.id}` : view.name;

  return (
    <div className="flex min-h-screen flex-col bg-white">
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
          </motion.div>
        </AnimatePresence>
      </main>
      <SiteFooter />
    </div>
  );
}
