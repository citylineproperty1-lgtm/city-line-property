"use client";

/**
 * Admin panel — reachable ONLY by typing /#/admin. No public links point here.
 * Session gate (httpOnly cookie) → shell with segmented tabs:
 * Overview · Inventory · Leads · Categories · Settings.
 */

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import Image from "next/image";
import {
  Boxes,
  ContactRound,
  ExternalLink,
  LayoutGrid,
  Loader2,
  LogOut,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { ApiError, BRAND_OUTLINE, SCROLLBAR_CLS, Segmented } from "./admin/admin-shared";
import { AdminLogin, type AdminUser } from "./admin/admin-login";
import { AdminOverview } from "./admin/admin-overview";
import { AdminInventory } from "./admin/admin-inventory";
import { AdminLeads } from "./admin/admin-leads";
import { AdminCategories } from "./admin/admin-categories";
import { AdminSettings } from "./admin/admin-settings";

type TabKey = "overview" | "inventory" | "leads" | "categories" | "settings";

type Session =
  | { status: "checking" }
  | { status: "out" }
  | { status: "in"; admin: AdminUser };

const TABS: { value: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "overview", label: "Overview", icon: LayoutGrid },
  { value: "inventory", label: "Inventory", icon: Boxes },
  { value: "leads", label: "Leads", icon: ContactRound },
  { value: "categories", label: "Categories", icon: ShieldCheck },
  { value: "settings", label: "Settings", icon: Settings2 },
];

export function AdminView() {
  const { navigate } = useAppStore();
  const [session, setSession] = useState<Session>({ status: "checking" });
  const [tab, setTab] = useState<TabKey>("overview");

  const handleAuthLoss = useCallback(() => {
    setSession((s) => (s.status === "in" ? { status: "out" } : s));
    toast.error("Session expired — please sign in again.");
  }, []);

  /** Authenticated fetch wrapper: JSON-first, flips to login on 401. */
  const api = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const isForm = init?.body instanceof FormData;
      const res = await fetch(path, {
        ...init,
        cache: "no-store",
        headers: {
          ...(isForm ? {} : { "Content-Type": "application/json" }),
          ...(init?.headers ?? {}),
        },
      });
      if (res.status === 401) {
        handleAuthLoss();
        throw new ApiError("Session expired", 401);
      }
      const text = await res.text();
      let data: unknown = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = {};
      }
      if (!res.ok) {
        const message =
          (data as { error?: string }).error ?? `Request failed (${res.status})`;
        throw new ApiError(message, res.status, data);
      }
      return data as T;
    },
    [handleAuthLoss]
  );

  // Restore an existing cookie session once on mount.
  useEffect(() => {
    let alive = true;
    fetch("/api/admin/me", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error("unauthorized");
        const d = (await res.json()) as { admin: AdminUser };
        if (alive) setSession({ status: "in", admin: d.admin });
      })
      .catch(() => {
        if (alive) setSession({ status: "out" });
      });
    return () => {
      alive = false;
    };
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } catch {
      // ignore network hiccups — drop the session locally regardless
    }
    setSession({ status: "out" });
    setTab("overview");
    toast.success("Signed out");
  };

  return (
    <div className="min-h-[70vh] bg-[#F7F9F8] pb-16">
      {session.status === "checking" && (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-neutral-400">
            <Loader2 className="h-6 w-6 animate-spin text-[#0F766E]" />
            <p className="text-[12.5px]">Checking your session…</p>
          </div>
        </div>
      )}

      {session.status === "out" && <AdminLogin onSuccess={(admin) => setSession({ status: "in", admin })} />}

      {session.status === "in" && (
        <>
          {/* Panel top bar (sticky below the public site header) */}
          <header className="sticky top-16 z-30 border-b border-black/[0.06] bg-[#F7F9F8]/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
              <div className="flex min-w-0 items-center gap-2.5">
                <Image
                  src="/logo.png"
                  alt="City Line Property logo"
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-xl border border-black/[0.06]"
                />
                <div className="min-w-0">
                  <p className="truncate text-[13.5px] font-semibold leading-tight tracking-tight text-neutral-900">
                    City Line Property
                    <span className="ml-2 rounded-full bg-[#E7F4F0] px-2 py-0.5 align-middle text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#0B6B5D]">
                      Admin
                    </span>
                  </p>
                  <p className="truncate text-[11px] text-neutral-400">{session.admin.name}</p>
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate({ name: "home" })}
                  className="h-9 rounded-full border-black/[0.09] bg-white px-3 text-[12.5px] font-semibold text-neutral-600 hover:bg-neutral-50 sm:px-4"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">View site</span>
                </Button>
                <Button
                  size="sm"
                  onClick={() => void logout()}
                  className={`h-9 rounded-full px-3 text-[12.5px] font-semibold sm:px-4 ${BRAND_OUTLINE}`}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            </div>

            {/* Segmented tabs */}
            <nav
              className="mx-auto max-w-6xl overflow-x-auto px-4 pb-3 sm:px-6"
              aria-label="Admin sections"
            >
              <div className="inline-flex min-w-full items-center gap-1 rounded-full bg-black/[0.055] p-1">
                {TABS.map((t) => {
                  const active = t.value === tab;
                  return (
                    <button
                      key={t.value}
                      role="tab"
                      aria-selected={active}
                      onClick={() => setTab(t.value)}
                      className={`relative flex-1 shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors sm:px-5 ${
                        active ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-800"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="admin-tab-pill"
                          className="absolute inset-0 rounded-full bg-white shadow-[0_1px_5px_rgba(0,0,0,0.12)]"
                          transition={{ type: "spring", bounce: 0.22, duration: 0.5 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center justify-center gap-1.5">
                        <t.icon className={`h-3.5 w-3.5 ${active ? "text-[#0F766E]" : "text-neutral-400"}`} />
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </nav>
          </header>

          {/* Panel body */}
          <main className={`mx-auto max-w-6xl px-4 pt-5 sm:px-6 ${SCROLLBAR_CLS}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {tab === "overview" && <AdminOverview api={api} onOpenLeads={() => setTab("leads")} />}
                {tab === "inventory" && <AdminInventory api={api} />}
                {tab === "leads" && <AdminLeads api={api} />}
                {tab === "categories" && <AdminCategories api={api} />}
                {tab === "settings" && <AdminSettings api={api} />}
              </motion.div>
            </AnimatePresence>
          </main>
        </>
      )}
    </div>
  );
}
