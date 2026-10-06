export type MeshNativeStatus = {
  status: "pending" | "active" | "expired" | "failed";
  expiresAt?: string | null;
};
