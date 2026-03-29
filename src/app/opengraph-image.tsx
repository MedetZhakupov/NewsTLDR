import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CaptionCraft — AI Captions for Every Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <div
            style={{
              fontSize: "72px",
              fontWeight: 800,
              color: "white",
              letterSpacing: "-2px",
            }}
          >
            CaptionCraft
          </div>
          <div
            style={{
              fontSize: "32px",
              color: "rgba(255,255,255,0.9)",
              textAlign: "center",
              maxWidth: "800px",
            }}
          >
            One screenshot. Five platforms. Instant captions.
          </div>
          <div
            style={{
              display: "flex",
              gap: "16px",
              marginTop: "20px",
            }}
          >
            {["📸 Instagram", "💼 LinkedIn", "🎵 TikTok", "𝕏 Twitter/X", "👥 Facebook"].map(
              (p) => (
                <div
                  key={p}
                  style={{
                    background: "rgba(255,255,255,0.2)",
                    borderRadius: "12px",
                    padding: "10px 20px",
                    color: "white",
                    fontSize: "20px",
                    fontWeight: 600,
                  }}
                >
                  {p}
                </div>
              )
            )}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
