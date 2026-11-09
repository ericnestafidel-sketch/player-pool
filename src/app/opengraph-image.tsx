import { ImageResponse } from "next/og";

export const alt = "Player Pool, a nationwide travel baseball player pool from Coach Eric LLC";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0f2a4a",
          color: "#ffffff",
          padding: "72px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            color: "#e8b923",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "0.08em",
          }}
        >
          <div style={{ width: 48, height: 8, background: "#e8b923" }} />
          PLAYER POOL
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.05, maxWidth: 900 }}>
            Find travel baseball players
          </div>
          <div style={{ fontSize: 30, color: "#e8b923" }}>USSSA level · county only · hand-approved coaches</div>
        </div>
        <div style={{ fontSize: 24, color: "#cbd5e1" }}>Coach Eric LLC dba Player Pool</div>
      </div>
    ),
    { ...size },
  );
}
