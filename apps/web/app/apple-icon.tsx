import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "#1B4332",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <span
          style={{
            fontFamily: "serif",
            fontWeight: 700,
            fontSize: 100,
            color: "#FEFAE0",
            lineHeight: 1,
          }}
        >
          M
        </span>
        {/* Gold dot accent */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            right: 28,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#D4A017",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
