import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #7c3aed, #ec4899)",
        }}
      >
        <span
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "white",
            letterSpacing: "-1px",
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
