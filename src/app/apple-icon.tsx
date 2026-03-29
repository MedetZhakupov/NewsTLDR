import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "36px",
          background: "linear-gradient(135deg, #7c3aed, #ec4899)",
        }}
      >
        <span
          style={{
            fontSize: 100,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-4px",
            lineHeight: 1,
          }}
        >
          C
        </span>
      </div>
    ),
    {
      ...size,
    }
  );
}
