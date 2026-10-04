"use client";

/**
 * Theme switcher — Light / Dark / System.
 *
 * Renders a compact frosted icon button that opens a dropdown with the three
 * options (checkmark on the active one). The icon reflects the *resolved*
 * theme so the button reads correctly even while following the system setting.
 *
 * `mounted` guard: next-themes resolves the theme only on the client, so the
 * icon is rendered after mount to avoid a hydration mismatch (and the button
 * keeps a stable size while unmounted).
 */
import { useTheme } from "next-themes";
import { Check, Monitor, Moon, Sun } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useSyncExternalStore } from "react";

/**
 * Hydration-safe "are we on the client" flag without setState-in-effect
 * (lint-clean alternative to the mounted/useEffect pattern).
 */
const emptySubscribe = () => () => {};
const useMounted = () =>
  useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

const OPTIONS = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
] as const;

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();

  const Icon = !mounted ? Sun : resolvedTheme === "dark" ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Change color theme"
        title="Change color theme"
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full text-[#64707C] transition-colors hover:bg-black/5 hover:text-[#0C1210] dark:text-[#94A3AB] dark:hover:bg-white/10 dark:hover:text-[#F3F6F5] outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className
        )}
      >
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36 rounded-2xl border-border bg-popover p-1.5">
        {OPTIONS.map((opt) => {
          const active = mounted && theme === opt.value;
          return (
            <DropdownMenuItem
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              aria-checked={active}
              role="menuitemradio"
              className={cn(
                "gap-2.5 rounded-xl px-3 py-2.5 text-[13.5px] font-medium",
                active ? "text-accent-foreground" : "text-foreground/80"
              )}
            >
              <opt.icon className="h-4 w-4 text-primary" aria-hidden />
              {opt.label}
              <Check className={cn("ml-auto h-4 w-4 text-primary", active ? "opacity-100" : "opacity-0")} aria-hidden />
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
