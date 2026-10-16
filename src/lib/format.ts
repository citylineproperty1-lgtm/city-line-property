/**
 * Currency + misc formatters for City Line Property.
 * PKR only (South-Asian numbering: Crore = 10M, Lakh = 100K).
 */

export function formatPKR(price: number, perMonth = false): string {
  const abs = Math.abs(price);
  let text: string;

  // 2 decimals + trim — exact lac precision (3.65 Crore stays "3.65 Crore",
  // never rounds to "3.6"/"3.7" which misquotes the price by 5 lac).
  if (abs >= 10_000_000) {
    text = `${trimZeros((price / 10_000_000).toFixed(2))} Crore`;
  } else if (abs >= 100_000) {
    text = `${trimZeros((price / 100_000).toFixed(2))} Lakh`;
  } else {
    text = new Intl.NumberFormat("en-PK").format(Math.round(price));
  }

  return `PKR ${text}${perMonth ? "/mo" : ""}`;
}

/** Ultra-short price label for map pins / tight chips: "1.6 Cr" / "85 L". */
export function compactPKR(price: number): string {
  const abs = Math.abs(price);
  if (abs >= 10_000_000) {
    return `${trimZeros((price / 10_000_000).toFixed(2))} Cr`;
  }
  if (abs >= 100_000) {
    return `${trimZeros((price / 100_000).toFixed(2))} L`;
  }
  return new Intl.NumberFormat("en-PK").format(Math.round(price));
}

/**
 * Price spoken in English (Pakistani convention) — e.g. 36500000 ->
 * "3 Crore 65 Lakh", 3650000 -> "36 Lakh 50 Thousand", 95000 -> "95 Thousand".
 * Used as a live "what am I actually typing?" hint in the admin price field.
 */
export function pkrInWords(price: number): string {
  const n = Math.round(Math.abs(price));
  if (!Number.isFinite(n) || n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 10_000_000);
  const lakh = Math.floor((n % 10_000_000) / 100_000);
  const thousand = Math.floor((n % 100_000) / 1000);
  const hundred = Math.floor((n % 1000) / 100);
  const rest = n % 100;
  if (crore) parts.push(`${crore} Crore`);
  if (lakh) parts.push(`${lakh} Lakh`);
  if (thousand) parts.push(`${thousand} Thousand`);
  if (hundred) parts.push(`${hundred} Hundred`);
  if (rest) parts.push(String(rest));
  return parts.join(" ");
}

function trimZero(v: string): string {
  return v.endsWith(".0") ? v.slice(0, -2) : v;
}

/** Strip trailing zeros after a decimal point: "3.65"→"3.65", "3.60"→"3.6", "4.00"→"4". */
function trimZeros(v: string): string {
  return v.includes(".") ? v.replace(/0+$/, "").replace(/\.$/, "") : v;
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
