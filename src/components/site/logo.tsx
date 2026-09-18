import Image from "next/image";
import { cn } from "@/lib/utils";
import { BUSINESS } from "@/lib/business";

export type LogoSize = "sm" | "md" | "lg";

const DIMS: Record<LogoSize, { px: number; word: string; tag: string }> = {
  sm: { px: 32, word: "text-[13px]", tag: "text-[7.5px] tracking-[0.2em]" },
  md: { px: 40, word: "text-[15px]", tag: "text-[8.5px] tracking-[0.24em]" },
  lg: { px: 56, word: "text-xl", tag: "text-[10px] tracking-[0.3em]" },
};

/**
 * Reusable brand lockup: circular gold logo + "CITYLINE PROPERTY" wordmark
 * rendered with the brand gold gradient, with an optional tagline.
 *
 * `tone="light"` → gradients tuned for light backgrounds (default).
 * `tone="dark"`  → lighter gold ramp for dark surfaces (footer, hero bands).
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
      <Image
        src="/logo.png"
        alt="City Line Property logo"
        width={d.px}
        height={d.px}
        className={cn(
          "shrink-0 rounded-full object-cover",
          "ring-1 ring-[#C9A227]/35 shadow-[0_2px_10px_-2px_rgba(154,123,26,0.45)]"
        )}
      />
      {withWordmark && (
        <span className="flex flex-col items-start leading-none">
          <span
            className={cn(
              "font-extrabold tracking-tight whitespace-nowrap",
              d.word,
              tone === "light" ? "text-gold-gradient" : "text-gold-gradient-dark"
            )}
          >
            CITYLINE&nbsp;PROPERTY
          </span>
          {tagline && (
            <span
              className={cn(
                "mt-1 font-semibold uppercase whitespace-nowrap",
                d.tag,
                tone === "light" ? "text-[#8C6D1F]/70" : "text-[#C9A227]/80"
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
