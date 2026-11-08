import { ImageResponse } from "next/og";

const sizes = { "192": 192, "512": 512, maskable: 512 } as const;

// Home-screen icons. The maskable one keeps the mark inside the safe zone.
export async function GET(_request: Request, context: { params: Promise<{ size: string }> }) {
  const key = (await context.params).size as keyof typeof sizes;
  const size = sizes[key];
  if (!size) return new Response("Not found", { status: 404 });
  const mark = Math.round(size * (key === "maskable" ? 0.5 : 0.66));
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#203c32", borderRadius: key === "maskable" ? 0 : size * 0.2 }}>
      <svg width={mark} height={mark} viewBox="0 0 36 36" fill="none"><path d="M4 26V12a6 6 0 0 1 12 0v12a6 6 0 0 0 12 0V10M10 26V12a6 6 0 0 1 12 0v12a6 6 0 0 0 12 0V10" stroke="#dff58b" strokeWidth="2.8" strokeLinecap="round" /></svg>
    </div>,
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=86400" } },
  );
}
