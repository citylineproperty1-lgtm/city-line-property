import { cn } from "@/lib/utils";
import { BUSINESS } from "@/lib/business";
import Image from "next/image";

export type LogoSize = "sm" | "md" | "lg";

const DIMS: Record<LogoSize, { px: number; word: string; tag: string }> = {
  sm: { px: 32, word: "text-[13px]", tag: "text-[7.5px] tracking-[0.2em]" },
  md: { px: 40, word: "text-[15px]", tag: "text-[8.5px] tracking-[0.24em]" },
  lg: { px: 56, word: "text-xl", tag: "text-[10px] tracking-[0.3em]" },
};

/** Brand mark — white plaque tile carrying the official GOLD Cityline
 *  emblem (house-in-circle). Glass highlight + light-sweep shimmer cross it
 *  on a loop (honoring prefers-reduced-motion). */
export function Monogram({ px }: { px: number }) {
  return (
    <span
      aria-hidden
      style={{ width: px, height: px }}
      className={cn(
        "clp-logo-tile relative flex shrink-0 items-center justify-center overflow-hidden rounded-[28%]"
      )}
    >
      <Image
        src="/logo-mark.png"
        alt=""
        width={px}
        height={px}
        className="relative h-full w-full object-contain p-[6%]"
      />
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
              tone === "light" ? "text-foreground" : "text-white"
            )}
          >
            CITY LINE PROPERTY
          </span>
          {tagline && (
            <span
              className={cn(
                "mt-1 font-semibold uppercase whitespace-nowrap",
                d.tag,
                tone === "light" ? "text-accent-foreground/80" : "text-[#7FE0CD]"
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
