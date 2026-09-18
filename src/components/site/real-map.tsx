"use client";

import { useEffect, useRef } from "react";
import type * as LType from "leaflet";
import { OFFICE_COORD } from "@/lib/business";

/**
 * Real interactive map — Leaflet + OpenStreetMap raster tiles (no fake SVG).
 * Tiles and streets are live; the office pin is the verified Raiwind Road
 * location. Loaded client-side only via dynamic import (SSR-safe).
 */

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  /** Title shown in the popup header. */
  title: string;
  /** Optional price line (already formatted, e.g. "1.6 Cr"). */
  price?: string;
  /** Optional subtitle line. */
  subtitle?: string;
  /** Visual kind — drives pin color. */
  kind?: "property" | "office" | "area";
}

interface RealMapProps {
  markers: MapMarker[];
  /** Initial center; defaults to the office. */
  center?: { lat: number; lng: number };
  zoom?: number;
  className?: string;
  /** Called when a property/area marker popup is clicked. */
  onSelect?: (id: string) => void;
  /** Show the "Get Directions" CTA inside the office popup. */
  officePopup?: boolean;
  /** Fit all markers into view on mount. */
  fitMarkers?: boolean;
}

const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTRIB =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

const PIN_COLORS: Record<string, string> = {
  property: "#0F766E",
  office: "#111827",
  area: "#0F766E",
};

function pinIcon(L: typeof LType, kind: string, label?: string): LType.DivIcon {
  const color = PIN_COLORS[kind] ?? PIN_COLORS.property;
  const size = kind === "office" ? 34 : 30;
  const glyph =
    kind === "office"
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></svg>'
      : `<span style="font-size:10px;font-weight:700;color:#fff;letter-spacing:-0.02em;">${label ?? "•"}</span>`;
  return L.divIcon({
    className: "clp-pin",
    html: `<div style="
      width:${size}px;height:${size}px;border-radius:${kind === "office" ? "10px" : "50% 50% 50% 4px"};
      transform:rotate(${kind === "office" ? "0deg" : "-45deg"});
      background:${color};display:flex;align-items:center;justify-content:center;
      box-shadow:0 6px 16px rgba(15,118,110,.35),0 0 0 3px rgba(255,255,255,.9);
      ${kind === "office" ? "border-radius:10px;transform:rotate(0);" : "transform:rotate(-45deg) translateY(-2px);"}
    "><span style="transform:rotate(${kind === "office" ? "0deg" : "45deg"});display:flex;align-items:center;justify-content:center;">${glyph}</span></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4],
  });
}

export default function RealMap({
  markers,
  center,
  zoom = 14,
  className = "h-[420px] w-full",
  onSelect,
  officePopup = false,
  fitMarkers = false,
}: RealMapProps) {
  const elRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LType.Map | null>(null);
  const leafletRef = useRef<typeof LType | null>(null);
  const layerRef = useRef<LType.LayerGroup | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current || mapRef.current) return;
      leafletRef.current = L;

      const c = center ?? OFFICE_COORD;
      const map = L.map(elRef.current, {
        center: [c.lat, c.lng],
        zoom,
        scrollWheelZoom: false,
        zoomControl: true,
        attributionControl: true,
      });
      L.tileLayer(TILES, { attribution: ATTRIB, maxZoom: 19 }).addTo(map);
      map.on("focus", () => map.scrollWheelZoom.enable());
      map.on("blur", () => map.scrollWheelZoom.disable());
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      // Force redraw after container becomes visible.
      setTimeout(() => map.invalidateSize(), 80);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        layerRef.current = null;
      }
    };
  }, []);

  // Render markers whenever they change (or once the map is ready).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Wait for the map to be initialized.
      for (let i = 0; i < 40 && !mapRef.current; i++) {
        await new Promise((r) => setTimeout(r, 50));
      }
      const L = leafletRef.current;
      const map = mapRef.current;
      const layer = layerRef.current;
      if (cancelled || !L || !map || !layer) return;

      layer.clearLayers();
      const bounds: LType.LatLngExpression[] = [];

      for (const m of markers) {
        bounds.push([m.lat, m.lng]);
        const marker = L.marker([m.lat, m.lng], {
          icon: pinIcon(L, m.kind ?? "property", m.kind === "office" ? undefined : "₨"),
        }).addTo(layer);

        const rows: string[] = [];
        if (m.price) {
          rows.push(
            `<div style="font-weight:800;color:#0F766E;font-size:14px;margin:2px 0 4px;">${
              m.price.startsWith("PKR") ? m.price : `PKR ${m.price}`
            }</div>`
          );
        }
        if (m.subtitle) {
          rows.push(`<div style="color:#6B7280;font-size:11px;">${m.subtitle}</div>`);
        }
        const cta =
          m.kind === "office" && officePopup
            ? `<a href="https://www.google.com/maps/dir/?api=1&destination=${m.lat},${m.lng}" target="_blank" rel="noreferrer" style="display:inline-block;margin-top:8px;background:#0F766E;color:#fff;font-size:11px;font-weight:700;padding:6px 10px;border-radius:999px;text-decoration:none;">Get Directions →</a>`
            : m.kind !== "office" && selectRef.current
              ? `<button data-clp-id="${m.id}" style="margin-top:8px;background:#0F766E;color:#fff;font-size:11px;font-weight:700;padding:6px 12px;border-radius:999px;border:none;cursor:pointer;">View details →</button>`
              : "";

        marker.bindPopup(
          `<div style="min-width:150px;">
            <div style="font-weight:700;color:#111827;font-size:13px;line-height:1.3;">${m.title}</div>
            ${rows.join("")}
            ${cta}
          </div>`
        );

        if (m.kind !== "office" && selectRef.current) {
          marker.on("popupopen", (e) => {
            const node = e.popup.getElement();
            const btn = node?.querySelector<HTMLButtonElement>("[data-clp-id]");
            btn?.addEventListener("click", () => selectRef.current?.(m.id));
          });
        }
      }

      if (fitMarkers && bounds.length > 1) {
        map.fitBounds(L.latLngBounds(bounds).pad(0.25));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [markers, fitMarkers, officePopup]);

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-black/8 shadow-[0_2px_12px_rgba(15,23,42,0.06)] ${className}`}
      role="application"
      aria-label="Interactive OpenStreetMap"
    >
      <div ref={elRef} className="h-full w-full" />
    </div>
  );
}
