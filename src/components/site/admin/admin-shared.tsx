"use client";

/**
 * Shared building blocks for the admin panel (iOS-gold design language).
 * Warm ivory canvas #F2F2F7, white rounded-3xl cards, hairline borders,
 * gold #C9A227 accents. Colors are inline Tailwind values on purpose —
 * the admin surface must stay on-brand even if the public theme changes.
 */

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

/* ---------------------------------- API ---------------------------------- */

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

export type AdminApi = <T = unknown>(path: string, init?: RequestInit) => Promise<T>;

/** True when an error is just the global 401 session-flip (already handled by the shell). */
export function isAuthLoss(err: unknown): boolean {
  return err instanceof ApiError && err.status === 401;
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Something went wrong";
}

/* ------------------------------ Design tokens ----------------------------- */

/** Gold gradient primary action — white text on gold. */
export const GOLD_BTN =
  "bg-[linear-gradient(180deg,#DCB94F_0%,#C9A227_100%)] text-white shadow-[0_4px_14px_rgba(201,162,39,0.35)] hover:brightness-[1.06] border-0";

/** Gold outline action (logout, secondary gold CTAs). */
export const GOLD_OUTLINE =
  "border border-[#C9A227]/45 bg-white text-[#8A7119] hover:bg-[#C9A227]/10";

export const GOLD_TEXT = "text-[#8A7119]";
export const GOLD = "#C9A227";

/** White rounded-3xl card with hairline border. */
export function AdminCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-black/[0.06] bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

/** Styled overflow scrollbar for long lists. */
export const SCROLLBAR_CLS =
  "[scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/15 [&::-webkit-scrollbar-track]:bg-transparent";

/* ---------------------------- Segmented control --------------------------- */

export interface SegmentOption<T extends string> {
  value: T;
  label: string;
  badge?: number;
  dot?: string;
}

/** iOS segmented control with a framer layoutId sliding pill. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  className,
}: {
  options: SegmentOption<T>[];
  value: T;
  onChange: (v: T) => void;
  layoutId: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-black/[0.055] p-1",
        SCROLLBAR_CLS,
        className
      )}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative shrink-0 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium transition-colors",
              active ? "text-neutral-900" : "text-neutral-500 hover:text-neutral-800"
            )}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.12)]"
                transition={{ type: "spring", bounce: 0.22, duration: 0.5 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5 whitespace-nowrap">
              {o.dot && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: o.dot }}
                  aria-hidden
                />
              )}
              {o.label}
              {o.badge !== undefined && o.badge > 0 && (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-px text-[10px] font-bold tabular-nums",
                    active ? "bg-[#C9A227] text-white" : "bg-black/[0.07] text-neutral-500"
                  )}
                >
                  {o.badge}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------- KPI cards ------------------------------- */

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  highlight,
  delay = 0,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  hint?: React.ReactNode;
  highlight?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut", delay }}
      className={cn(
        "rounded-3xl border bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] sm:p-5",
        highlight
          ? "border-[#C9A227]/40 bg-[linear-gradient(180deg,rgba(201,162,39,0.10),rgba(255,255,255,1))]"
          : "border-black/[0.06]"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "text-[22px] font-semibold leading-none tracking-tight tabular-nums sm:text-2xl",
            highlight ? "text-[#8A7119]" : "text-neutral-900"
          )}
        >
          {value}
        </p>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
            highlight ? "bg-[#C9A227]/15 text-[#8A7119]" : "bg-black/[0.045] text-[#8A7119]"
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-2 text-[12px] font-medium text-neutral-500">{label}</p>
      {hint && <div className="mt-1 text-[11px] leading-tight text-neutral-400">{hint}</div>}
    </motion.div>
  );
}

/* ------------------------------ Domain chips ------------------------------ */

export const LEAD_STATUS_META: Record<
  string,
  { label: string; color: string; chip: string }
> = {
  NEW: {
    label: "New",
    color: "#C9A227",
    chip: "bg-[#C9A227]/12 text-[#8A7119] border-[#C9A227]/30",
  },
  CONTACTED: {
    label: "Contacted",
    color: "#30B0C7",
    chip: "bg-[#30B0C7]/12 text-[#1F7A8A] border-[#30B0C7]/30",
  },
  SITE_VISIT: {
    label: "Site Visit",
    color: "#AF52DE",
    chip: "bg-[#AF52DE]/10 text-[#8E44AD] border-[#AF52DE]/30",
  },
  NEGOTIATION: {
    label: "Negotiation",
    color: "#FF9500",
    chip: "bg-[#FF9500]/12 text-[#B36B00] border-[#FF9500]/30",
  },
  WON: {
    label: "Won",
    color: "#34C759",
    chip: "bg-[#34C759]/12 text-[#1E8E3E] border-[#34C759]/30",
  },
  LOST: {
    label: "Lost",
    color: "#8E8E93",
    chip: "bg-black/[0.05] text-neutral-500 border-black/10",
  },
};

export const WA_META: Record<string, { label: string; dot: string }> = {
  SENT: { label: "WhatsApp sent", dot: "#34C759" },
  FAILED: { label: "WhatsApp failed", dot: "#FF3B30" },
  SKIPPED: { label: "WhatsApp skipped", dot: "#8E8E93" },
  PENDING: { label: "WhatsApp pending", dot: "#F5C13D" },
};

export const LISTING_STATE_META: Record<string, { label: string; chip: string }> = {
  AVAILABLE: { label: "Available", chip: "bg-[#34C759]/12 text-[#1E8E3E] border-[#34C759]/30" },
  RESERVED: { label: "Reserved", chip: "bg-[#FF9500]/12 text-[#B36B00] border-[#FF9500]/30" },
  SOLD: { label: "Sold", chip: "bg-[#FF3B30]/10 text-[#C0392B] border-[#FF3B30]/25" },
  RENTED: { label: "Rented", chip: "bg-[#30B0C7]/12 text-[#1F7A8A] border-[#30B0C7]/30" },
};

export const SOURCE_LABELS: Record<string, string> = {
  WEBSITE: "Website",
  CONTACT: "Contact form",
  PROPERTY: "Listing",
  REQUIREMENT: "Requirement",
};

/** Colored status pill (lead pipeline). */
export function StatusChip({ status, className }: { status: string; className?: string }) {
  const meta = LEAD_STATUS_META[status] ?? LEAD_STATUS_META.NEW;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        meta.chip,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} aria-hidden />
      {meta.label}
    </span>
  );
}

/** WhatsApp delivery dot + label. */
export function WaChip({ status, className }: { status: string; className?: string }) {
  const meta = WA_META[status] ?? WA_META.PENDING;
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-500", className)}
      title={meta.label}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: meta.dot }}
        aria-label={meta.label}
      />
      {meta.label.replace("WhatsApp ", "")}
    </span>
  );
}

/* --------------------------------- Helpers -------------------------------- */

export function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

/** "0321 8422109" → "923218422109" for wa.me deep links. */
export function toInternationalPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92")) return digits;
  if (digits.startsWith("03")) return `92${digits.slice(1)}`;
  if (digits.startsWith("3") && digits.length === 10) return `92${digits}`;
  return digits;
}

export type DueState = "overdue" | "today" | "soon" | "later";

/** Classify a follow-up date relative to now (end of today / +48h window). */
export function dueState(iso: string | null | undefined): DueState | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const now = new Date();
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const endOfDayAfterTomorrow = new Date(endOfToday);
  endOfDayAfterTomorrow.setDate(endOfDayAfterTomorrow.getDate() + 2);
  if (t < now) return "overdue";
  if (t <= endOfToday.getTime()) return "today";
  if (t <= endOfDayAfterTomorrow.getTime()) return "soon";
  return "later";
}

/** Short human label for a follow-up date: "Overdue 2d" · "Today 4 PM" · "Fri 20 Sep". */
export function dueLabel(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const state = dueState(iso);
  const time = d.toLocaleTimeString("en-GB", { hour: "numeric", minute: "2-digit" });
  const dayMonth = d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  if (state === "overdue") {
    const days = Math.max(1, Math.round((Date.now() - d.getTime()) / 86_400_000));
    return `Overdue ${days}d`;
  }
  if (state === "today") return `Today ${time}`;
  if (state === "soon") return `Tomorrow ${time}`;
  return `${dayMonth} ${time}`;
}

/** Chip classes per due state (iOS palette, gold-forward). */
export const DUE_CHIP: Record<DueState, string> = {
  overdue: "bg-[#FF3B30]/10 text-[#C0392B] ring-1 ring-[#FF3B30]/25",
  today: "bg-[linear-gradient(180deg,#DCB94F_0%,#C9A227_100%)] text-white shadow-sm",
  soon: "bg-[#F5EDD7] text-[#8C6D1F] ring-1 ring-[#C9A227]/30",
  later: "bg-black/[0.05] text-neutral-500",
};

/** Debounce any value (search inputs etc.). */
export function useDebounced<T>(value: T, ms = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/** Fade-up presets shared by panel sections. */
export const fadeUp = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: "easeOut" as const },
};
