"use client";

import { useEffect, useState } from "react";

/**
 * Shows server-rendered SEO content only while the SPA is on the home view.
 *
 - Crawlers always receive the full content in the initial HTML for "/".
 * When the visitor navigates to a hash view (e.g. #/admin, #/properties)
 * the block is removed from the DOM so it never clutters other views.
 */
export function SeoGate({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const update = () => {
      const h = window.location.hash;
      setVisible(!h || h === "#" || h === "#/" || h === "#/home");
    };
    update();
    window.addEventListener("hashchange", update);
    return () => window.removeEventListener("hashchange", update);
  }, []);

  if (!visible) return null;
  return <>{children}</>;
}
