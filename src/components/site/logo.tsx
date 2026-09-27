import { useId } from "react";
import { cn } from "@/lib/utils";
import { BUSINESS } from "@/lib/business";

export type LogoSize = "sm" | "md" | "lg";

const DIMS: Record<LogoSize, { px: number; word: string; tag: string }> = {
  sm: { px: 32, word: "text-[13px]", tag: "text-[7.5px] tracking-[0.2em]" },
  md: { px: 40, word: "text-[15px]", tag: "text-[8.5px] tracking-[0.24em]" },
  lg: { px: 56, word: "text-xl", tag: "text-[10px] tracking-[0.3em]" },
};

/** Brand mark — animated aurora-glass tile with a white home whose interior
 *  reveals a rising GOLDEN city: "the golden city lives here". The tile pans a
 *  teal→cyan aurora, carries a fixed glass highlight + inner ring, and a light
 *  sweep crosses it on a loop (all honoring prefers-reduced-motion). */
export function Monogram({ px }: { px: number }) {
  const gid = useId().replace(/:/g, "");
  return (
    <span
      aria-hidden
      style={{ width: px, height: px }}
      className={cn(
        "clp-logo-tile relative flex shrink-0 items-center justify-center overflow-hidden rounded-[28%]"
      )}
    >
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className="relative h-[70%] w-[70%] drop-shadow-[0_1.5px_2px_rgba(8,60,52,0.35)]"
      >
        <defs>
          <linearGradient id={`${gid}-city`} x1="24" y1="26" x2="24" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FDE68A" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
        <path d="M12.5 40V22.5L24 12l11.5 10.5V40z" fill="white" />
        <path d="M16 40v-6.2h4V29h4.4v4.8h2.4v-7.6h4.4v5.4h2.8V40z" fill={`url(#${gid}-city)`} />
      </svg>
      <span className="clp-logo-glass" />
      <span className="clp-logo-shimmer" />
    </span>
  );
}

/**
 * Reusable brand lockup: emerald monogram mark + "CITY LINE PROPERTY"
 * wordmark in near-black ink, with an optional tagline.
 *
 * `tone="light"` → for white surfaces (default).
 * `tone="dark"`  → tuned for dark surfaces (footer, hero bands).
 */
export function Logo({
  size = "md",
  withWordmark = true,
  tagline = false,
  tone = "light",
  className,
}: {
  size?: LogoSize;
  withWordmark?: boolean;
  tagline?: boolean;
  tone?: "light" | "dark";
  className?: string;
}) {
  const d = DIMS[size];
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Monogram px={d.px} />
      {withWordmark && (
        <span className="flex flex-col items-start leading-none">
          <span
            className={cn(
              "font-extrabold tracking-tight whitespace-nowrap",
              d.word,
              tone === "light" ? "text-[#0C1210]" : "text-white"
            )}
          >
            CITY LINE PROPERTY
          </span>
          {tagline && (
            <span
              className={cn(
                "mt-1 font-semibold uppercase whitespace-nowrap",
                d.tag,
                tone === "light" ? "text-[#0B6B5D]/80" : "text-[#7FE0CD]"
              )}
            >
              {BUSINESS.taglineUpper}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
