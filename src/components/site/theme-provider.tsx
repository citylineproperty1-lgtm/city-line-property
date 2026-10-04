"use client";

/**
 * next-themes provider — wires class-based dark mode (`<html class="dark">`)
 * into the SPA. `suppressHydrationWarning` is already set on <html> so the
 * pre-hydration script that next-themes injects (to avoid a light flash for
 * dark-mode visitors) cannot cause a hydration mismatch.
 *
 * Light values live in `:root`, dark overrides in `.dark` (globals.css).
 * The brand palette (emerald) is shared by both themes; only surfaces, ink
 * and borders flip.
 */
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
