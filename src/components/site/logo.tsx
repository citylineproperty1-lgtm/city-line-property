import { cn } from "@/lib/utils";
import { BUSINESS } from "@/lib/business";

export type LogoSize = "sm" | "md" | "lg";

const DIMS: Record<LogoSize, { px: number; word: string; tag: string }> = {
  sm: { px: 32, word: "text-[13px]", tag: "text-[7.5px] tracking-[0.2em]" },
  md: { px: 40, word: "text-[15px]", tag: "text-[8.5px] tracking-[0.24em]" },
  lg: { px: 56, word: "text-xl", tag: "text-[10px] tracking-[0.3em]" },
};

/** Minimal white "city line" skyline glyph used inside the emerald mark.
 *  Left stepped building + center antenna tower + right pitched-roof house
 *  (the "property") sitting above the brand baseline, with a soft sun accent.
 *  Below px 40 the windows/door drop out so the mark stays crisp at favicon size. */
export function Monogram({ px }: { px: number }) {
  const detail = px >= 40;
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
      <svg viewBox="0 0 48 48" fill="none" className="h-[70%] w-[70%]">
        {/* sun accent */}
        <circle cx="37.5" cy="10.5" r="3" fill="white" fillOpacity="0.55" />
        {/* antenna on the tall tower */}
        <rect x="23" y="7" width="2" height="6" rx="1" fill="white" fillOpacity="0.95" />
        {/* left building — stepped roof */}
        <path
          fill="white"
          fillOpacity="0.92"
          fillRule="evenodd"
          clipRule="evenodd"
          d={
            detail
              ? "M7 38V21h3v-5h3v5h3v17zM10 24.5h3v3.4h-3z"
              : "M7 38V21h3v-5h3v5h3v17z"
          }
        />
        {/* center tower — the tallest structure, window grid at detail size */}
        <path
          fill="white"
          fillRule="evenodd"
          clipRule="evenodd"
          d={
            detail
              ? "M19.5 38V12h9v26zM21.4 15.8h2.4v3.2h-2.4zM24.6 15.8h2.4v3.2h-2.4zM21.4 21.4h2.4v3.2h-2.4zM24.6 21.4h2.4v3.2h-2.4z"
              : "M19.5 38V12h9v26z"
          }
        />
        {/* right house — pitched roof + door reads as "property" */}
        <path
          fill="white"
          fillOpacity="0.94"
          fillRule="evenodd"
          clipRule="evenodd"
          d={
            detail
              ? "M32 38V26.5L36.5 21l4.5 5.5V38zM35.2 31.5h2.6V38h-2.6z"
              : "M32 38V26.5L36.5 21l4.5 5.5V38z"
          }
        />
        {/* baseline — the "line" in City Line */}
        <rect x="6.5" y="40.4" width="35" height="2.6" rx="1.3" fill="white" fillOpacity="0.9" />
      </svg>
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
