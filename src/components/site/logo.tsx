import { cn } from "@/lib/utils";
import { BUSINESS } from "@/lib/business";

export type LogoSize = "sm" | "md" | "lg";

const DIMS: Record<LogoSize, { px: number; word: string; tag: string }> = {
  sm: { px: 32, word: "text-[13px]", tag: "text-[7.5px] tracking-[0.2em]" },
  md: { px: 40, word: "text-[15px]", tag: "text-[8.5px] tracking-[0.24em]" },
  lg: { px: 56, word: "text-xl", tag: "text-[10px] tracking-[0.3em]" },
};

/** White "city line" glyph inside the emerald mark: a home whose interior
 *  reveals a rising city skyline — "the city lives here". One design at all
 *  sizes (verified legible 32px → 512px); the negative-space skyline IS the
 *  brand story: City Line inside Property. */
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
      <svg viewBox="0 0 48 48" fill="none" className="h-[70%] w-[70%]">
        <path
          fill="white"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12.5 40V22.5L24 12l11.5 10.5V40zM16 40v-6.2h4V29h4.4v4.8h2.4v-7.6h4.4v5.4h2.8V40z"
        />
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
