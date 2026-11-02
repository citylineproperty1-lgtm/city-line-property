"use client";

import { useEffect } from "react";

/**
 * Consent-gated Google Analytics 4 loader.
 *
 * Replaces the always-on <Script> tags in the root layout: gtag.js is NOT
 * downloaded until the visitor accepts the cookie banner. The banner fires
 * `clp:consent` on the window when consent is granted; this component then
 * injects the scripts once. Until then analytics is truly off — no cookies,
 * no network requests, nothing.
 *
 * trackEvent() (src/lib/analytics.ts) is already a safe no-op while
 * window.gtag is missing, so every existing call site keeps working.
 */

const GA4_ID = "G-1JLS4S6NSX";
const CONSENT_KEY = "clp-cookie-consent";
const CONSENT_EVENT = "clp:consent";

let injected = false;

function injectGa() {
  if (injected || typeof document === "undefined") return;
  injected = true;

  const gtagJs = document.createElement("script");
  gtagJs.async = true;
  gtagJs.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
  document.head.appendChild(gtagJs);

  const inline = document.createElement("script");
  inline.textContent =
    "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}" +
    `gtag('js',new Date());gtag('config','${GA4_ID}');`;
  document.head.appendChild(inline);
}

export function AnalyticsGate() {
  useEffect(() => {
    const sync = () => {
      try {
        if (localStorage.getItem(CONSENT_KEY) === "accepted") injectGa();
      } catch {
        /* storage unavailable — analytics simply stays off */
      }
    };
    sync();
    window.addEventListener(CONSENT_EVENT, sync);
    return () => window.removeEventListener(CONSENT_EVENT, sync);
  }, []);

  return null;
}
