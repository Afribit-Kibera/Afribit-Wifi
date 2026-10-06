import type { MeshNativeStatus } from "../mesh-access/status-types";

export type CustomerPaymentState = "waiting" | "approve" | "confirming" | "connecting" | "active" | "review" | "failed" | "expired";
export type CustomerPaymentEvidence = {
  status: string; providerStatus?: string; collectionConfirmed?: boolean;
  resolutionRequired?: boolean; settlementStatus?: string; nativeAccess?: MeshNativeStatus | null;
};

// A payment confirmation alone cannot unlock the success screen. The gateway
// must acknowledge access, and a stale or malformed deadline must not pass.
export function hasActiveInternetAccess(access: MeshNativeStatus | null | undefined, now = Date.now()): boolean {
  if (access?.status !== "active") return false;
  if (!access.expiresAt) return true;
  const deadline = Date.parse(access.expiresAt);
  return Number.isFinite(deadline) && deadline > now;
}

export function internetHandoff(userAgent: string): { url: string; automatic: boolean } {
  return {
    url: /Android/i.test(userAgent) ? "http://connectivitycheck.gstatic.com/generate_204" : "http://captive.apple.com/hotspot-detect.html",
    // Normal Safari/Chrome must retain the receipt. A missing Safari token is
    // not proof of a captive window: other in-app browsers omit it as well.
    automatic: /CaptiveNetworkSupport|CaptivePortal(?:Login)?/i.test(userAgent),
  };
}

// A pending device reservation exists before a customer has paid. It must
// never be presented as proof of payment or an active internet connection.
export function customerPaymentState(input: CustomerPaymentEvidence): CustomerPaymentState {
  if (hasActiveInternetAccess(input.nativeAccess)) return "active";
  if (input.nativeAccess?.status === "active") return "expired";
  if (input.nativeAccess?.status === "expired") return "expired";
  if (input.nativeAccess?.status === "failed") return "review";
  if (["expired", "invalid", "refunded"].includes(input.status)) return input.status === "expired" ? "expired" : "failed";
  if (input.status === "settled" || (input.nativeAccess?.status === "pending" && Boolean(input.nativeAccess.expiresAt))) return "connecting";
  if (input.settlementStatus === "review_required" || input.resolutionRequired) return "review";
  if (input.collectionConfirmed || input.providerStatus === "success" || input.providerStatus === "processing_payment") return "confirming";
  if (["processing", "ongoing", "pay_offline", "pending", "send_otp"].includes(input.providerStatus ?? "")) return "approve";
  return "waiting";
}
