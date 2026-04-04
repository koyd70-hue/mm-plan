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
          borderRadius: 6,
          background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 1,
        }}
      >
        {/* Head */}
        <div
          style={{
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: "white",
            marginBottom: 1,
          }}
        />
        {/* Body / shoulders */}
        <div
          style={{
            width: 16,
            height: 8,
            borderRadius: "8px 8px 0 0",
            background: "white",
            opacity: 0.9,
          }}
        />
        {/* Plan bars */}
        <div
          style={{
            display: "flex",
            gap: 2,
            marginTop: 1,
          }}
        >
          <div
            style={{ width: 4, height: 3, background: "#a5b4fc", borderRadius: 1 }}
          />
          <div
            style={{ width: 6, height: 3, background: "#c4b5fd", borderRadius: 1 }}
          />
          <div
            style={{ width: 3, height: 3, background: "#a5b4fc", borderRadius: 1 }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
