import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "#1B4332",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* "M" letter */}
        <span
          style={{
            fontFamily: "serif",
            fontWeight: 700,
            fontSize: 18,
            color: "#FEFAE0",
            lineHeight: 1,
            letterSpacing: "-0.5px",
          }}
        >
          M
        </span>
        {/* Gold dot accent */}
        <div
          style={{
            position: "absolute",
            bottom: 5,
            right: 5,
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#D4A017",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
