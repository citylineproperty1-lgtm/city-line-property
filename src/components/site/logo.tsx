import { cn } from "@/lib/utils";
import { BUSINESS } from "@/lib/business";

export type LogoSize = "sm" | "md" | "lg";

const DIMS: Record<LogoSize, { px: number; word: string; tag: string }> = {
  sm: { px: 32, word: "text-[13px]", tag: "text-[7.5px] tracking-[0.2em]" },
  md: { px: 40, word: "text-[15px]", tag: "text-[8.5px] tracking-[0.24em]" },
  lg: { px: 56, word: "text-xl", tag: "text-[10px] tracking-[0.3em]" },
};

/** Minimal white "city line" skyline glyph used inside the emerald mark. */
export function Monogram({ px }: { px: number }) {
  return (
    <span
      aria-hidden
      style={{ width: px, height: px }}
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-[28%]",
        "bg-[linear-gradient(135deg,#14B8A6_0%,#0F766E_52%,#0B5B54_100%)]",
        "ring-1 ring-black/[0.06] shadow-[0_2px_10px_-2px_rgba(15,118,110,0.45)]"
      )}
    >
      <svg viewBox="0 0 32 32" fill="none" className="h-[68%] w-[68%]">
        {/* Skyline bars */}
        <rect x="5" y="14" width="4.6" height="11" rx="1" fill="white" fillOpacity="0.92" />
        <rect x="11.7" y="7" width="4.6" height="18" rx="1" fill="white" />
        <rect x="18.4" y="11" width="4.6" height="14" rx="1" fill="white" fillOpacity="0.92" />
        <rect x="25.1" y="17" width="4.6" height="8" rx="1" fill="white" fillOpacity="0.78" />
        {/* Baseline — the "line" in City Line */}
        <rect x="2" y="27" width="28" height="2.4" rx="1.2" fill="white" fillOpacity="0.85" />
      </svg>
    </span>
  );
}

/**
 * Reusable brand lockup: emerald monogram mark + "CITYLINE PROPERTY"
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
            CITYLINE&nbsp;PROPERTY
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
