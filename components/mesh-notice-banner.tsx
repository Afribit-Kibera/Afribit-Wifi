import { Info, TriangleAlert } from "lucide-react";
import type { MeshNotice } from "@/lib/mesh-notice";

export function MeshNoticeBanner({ notice }: { notice: Pick<MeshNotice, "message" | "tone"> | null | undefined }) {
  if (!notice) return null;
  const Icon = notice.tone === "warning" ? TriangleAlert : Info;
  return <p className={`flow-notice is-${notice.tone}`} role="status"><Icon size={17} aria-hidden="true" /><span>{notice.message}</span></p>;
}
