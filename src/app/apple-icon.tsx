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
          borderRadius: 36,
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 4,
        }}
      >
        {/* Head */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "white",
            marginBottom: 4,
          }}
        />
        {/* Body / shoulders */}
        <div
          style={{
            width: 96,
            height: 48,
            borderRadius: "48px 48px 0 0",
            background: "white",
            opacity: 0.9,
          }}
        />
        {/* Plan bars */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 6,
          }}
        >
          <div
            style={{ width: 22, height: 14, background: "#a5b4fc", borderRadius: 4 }}
          />
          <div
            style={{ width: 34, height: 14, background: "#c4b5fd", borderRadius: 4 }}
          />
          <div
            style={{ width: 18, height: 14, background: "#a5b4fc", borderRadius: 4 }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
