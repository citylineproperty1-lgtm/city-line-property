/**
 * Currency + misc formatters for City Line Property.
 * PKR uses South-Asian numbering: Crore (10M) and Lakh (100K).
 * USD is a fixed-rate display conversion driven by the store toggle.
 */
import { useAppStore } from "@/lib/store";

/** Fixed display rate for the PKR ⇄ USD toggle (not a live FX quote). */
export const PKR_PER_USD = 278;

export function formatPKR(price: number, perMonth = false): string {
  if (useAppStore.getState().currency === "USD") {
    return `${formatUSD(price)}${perMonth ? "/mo" : ""}`;
  }

  const abs = Math.abs(price);
  let text: string;

  if (abs >= 10_000_000) {
    const cr = price / 10_000_000;
    text = `${trimZero(cr.toFixed(cr >= 100 ? 0 : 1))} Crore`;
  } else if (abs >= 100_000) {
    const lac = price / 100_000;
    text = `${trimZero(lac.toFixed(lac >= 100 ? 0 : 1))} Lakh`;
  } else {
    text = new Intl.NumberFormat("en-PK").format(Math.round(price));
  }

  return `PKR ${text}${perMonth ? "/mo" : ""}`;
}

/** Compact USD rendering of a PKR amount, e.g. $342K, $1.25M, $340/mo. */
export function formatUSD(pkr: number): string {
  const usd = pkr / PKR_PER_USD;
  const abs = Math.abs(usd);

  if (abs >= 1_000_000) return `$${trimZero((usd / 1_000_000).toFixed(2))}M`;
  if (abs >= 1_000) return `$${trimZero((usd / 1_000).toFixed(abs >= 100_000 ? 0 : 1))}K`;
  return `$${new Intl.NumberFormat("en-US").format(Math.round(usd))}`;
}

function trimZero(v: string): string {
  return v.endsWith(".0") ? v.slice(0, -2) : v;
}

export function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${trimZero((n / 1_000_000).toFixed(1))}M`;
  if (n >= 1_000) return `${trimZero((n / 1_000).toFixed(1))}K`;
  return `${n}`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Simple monthly installment estimate (amortized loan). */
export function monthlyInstallment(
  price: number,
  downPct: number,
  years: number,
  annualRate: number
): number {
  const principal = price * (1 - downPct / 100);
  const r = annualRate / 100 / 12;
  const n = years * 12;
  if (n <= 0) return 0;
  if (r === 0) return principal / n;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

export function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
