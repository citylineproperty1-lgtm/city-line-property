import { ImageResponse } from "next/og";

export const alt =
  "City Line Property — Real Estate Agency in Etihad Town, Lahore. Only 1% commission. Call 0309 4499940.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded social-share card (Open Graph / Twitter). White + teal brand. */
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
          padding: "58px 72px",
          position: "relative",
        }}
      >
        {/* Brand accent bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 18,
            backgroundColor: "#0F766E",
            display: "flex",
          }}
        />

        {/* Top badge */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              border: "3px solid #0F766E",
              borderRadius: 999,
              padding: "10px 26px",
            }}
          >
            <div
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                backgroundColor: "#0F766E",
                display: "flex",
              }}
            />
            <div
              style={{
                fontSize: 25,
                fontWeight: 700,
                color: "#0F766E",
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
              color: "#0A0A0A",
              letterSpacing: -3,
            }}
          >
            City Line Property
          </div>
          <div style={{ fontSize: 42, fontWeight: 700, color: "#0F766E" }}>
            Your Key to the City.
          </div>
        </div>

        {/* Footer block */}
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                backgroundColor: "#0F766E",
                color: "#ffffff",
                fontSize: 30,
                fontWeight: 700,
                padding: "14px 30px",
                borderRadius: 14,
              }}
            >
              ONLY 1% COMMISSION
            </div>
            <div
              style={{
                display: "flex",
                marginLeft: 20,
                color: "#525252",
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
              borderTop: "2px solid #E5E5E5",
              paddingTop: 22,
            }}
          >
            <div style={{ color: "#525252", fontSize: 23 }}>
              Etihad Town Phase 1 &amp; 2 · Royal Enclave · Premier Enclave · Overseas Block
            </div>
            <div style={{ color: "#0A0A0A", fontSize: 26, fontWeight: 700 }}>
              Call 0309 4499940
            </div>
          </div>
        </div>
      </div>
    ),
    size
  );
}
