import { ImageResponse } from "next/og";
import { OG_EMBLEM } from "@/lib/og-emblem";

export const alt =
  "City Line Property — Real Estate Agency in Etihad Town, Lahore. Only 1% commission. Call 0309 4499940.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Brand gold pulled from the official emblem (matches .clp-logo-tile tokens). */
const GOLD = "#C49426";
const GOLD_DEEP = "#A87B16";
const GOLD_SOFT = "#E3B94E";
const INK = "#0A0A0A";
const MUTED = "#525252";

/** Branded social-share card (Open Graph / Twitter / WhatsApp link preview).
 *  White + GOLD brand carrying the official Cityline emblem. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#ffffff",
          padding: "56px 72px 50px 90px",
          position: "relative",
        }}
      >
        {/* Brand accent bar — gold gradient */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 18,
            background: `linear-gradient(180deg, ${GOLD_SOFT} 0%, ${GOLD} 45%, ${GOLD_DEEP} 100%)`,
            display: "flex",
          }}
        />

        {/* Top row: official gold emblem + location badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 132,
              height: 132,
              borderRadius: 34,
              backgroundColor: "#ffffff",
              boxShadow: "0 4px 18px -4px rgba(196, 148, 38, 0.55)",
            }}
          >
            <img
              src={OG_EMBLEM}
              alt=""
              width={124}
              height={124}
              style={{ display: "flex", objectFit: "contain" }}
            />
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              border: `3px solid ${GOLD}`,
              borderRadius: 999,
              padding: "10px 26px",
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                backgroundColor: GOLD,
                display: "flex",
              }}
            />
            <div
              style={{
                fontSize: 25,
                fontWeight: 700,
                color: GOLD_DEEP,
                letterSpacing: 3,
              }}
            >
              REAL ESTATE · ETIHAD TOWN · LAHORE
            </div>
          </div>
        </div>

        {/* Brand block */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            marginLeft: 8,
          }}
        >
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: INK,
              letterSpacing: -3,
            }}
          >
            City Line Property
          </div>
          <div
            style={{ fontSize: 42, fontWeight: 700, color: GOLD_DEEP }}
          >
            Your Key to the City.
          </div>
        </div>

        {/* Footer block */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                background: `linear-gradient(135deg, ${GOLD_SOFT} 0%, ${GOLD} 55%, ${GOLD_DEEP} 100%)`,
                color: "#ffffff",
                fontSize: 30,
                fontWeight: 700,
                padding: "14px 30px",
                borderRadius: 14,
                boxShadow: "0 4px 14px -4px rgba(168, 123, 22, 0.6)",
              }}
            >
              ONLY 1% COMMISSION
            </div>
            <div
              style={{
                display: "flex",
                marginLeft: 20,
                color: MUTED,
                fontSize: 25,
              }}
            >
              Direct dealing · No middlemen · No hidden margin
            </div>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "2px solid #ECE3CC",
              paddingTop: 22,
            }}
          >
            <div style={{ color: MUTED, fontSize: 23 }}>
              Etihad Town Phase 1 &amp; 2 · Royal Enclave · Premier Enclave ·
              Overseas Block
            </div>
            <div style={{ color: INK, fontSize: 26, fontWeight: 700 }}>
              Call 0309 4499940
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
