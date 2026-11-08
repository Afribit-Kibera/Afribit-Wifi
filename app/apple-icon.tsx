import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#203c32" }}>
      <svg width="112" height="112" viewBox="0 0 36 36" fill="none"><path d="M4 26V12a6 6 0 0 1 12 0v12a6 6 0 0 0 12 0V10M10 26V12a6 6 0 0 1 12 0v12a6 6 0 0 0 12 0V10" stroke="#dff58b" strokeWidth="2.8" strokeLinecap="round" /></svg>
    </div>,
    size,
  );
}
