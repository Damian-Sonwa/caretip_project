import { getSocketIO } from "./socketServer.js";

/** Staff, locations, tables, or assignments changed — refresh dashboards & public tipping UIs. */
export function emitBusinessDataChanged(businessId: string, reason: string): void {
  const io = getSocketIO();
  if (!io) return;
  const payload = { businessId, reason, at: new Date().toISOString() };
  io.to(`business:${businessId}`).emit("business_data_updated", payload);
  io.to(`public:business:${businessId}`).emit("business_data_updated", { businessId, reason });
}

export function emitVerificationUpdated(
  businessId: string,
  verificationStatus: "pending" | "verified" | "rejected"
): void {
  const io = getSocketIO();
  if (!io) return;
  const payload = { businessId, verificationStatus, at: new Date().toISOString() };
  io.to(`business:${businessId}`).emit("verification_updated", payload);
  io.to(`public:business:${businessId}`).emit("verification_updated", { businessId, verificationStatus });
  io.to("platform").emit("platform_verification_updated", payload);
}

/** Broad platform-admin refresh (stats, business lists). */
export function emitPlatformDataUpdated(reason: string): void {
  const io = getSocketIO();
  if (!io) return;
  io.to("platform").emit("platform_data_updated", { reason, at: new Date().toISOString() });
}
