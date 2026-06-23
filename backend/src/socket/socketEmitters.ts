import { getSocketIO } from "./socketServer.js";
import {
  emitCanonicalFromBusinessDataReason,
  emitNotificationCreatedCanonical,
} from "./realtimeContracts.js";

/** Staff, locations, tables, or assignments changed — refresh dashboards & public tipping UIs. */
export function emitBusinessDataChanged(businessId: string, reason: string): void {
  const io = getSocketIO();
  if (!io) return;
  const payload = { businessId, reason, at: new Date().toISOString() };
  io.to(`business:${businessId}`).emit("business_data_updated", payload);
  io.to(`public:business:${businessId}`).emit("business_data_updated", {
    businessId,
    at: payload.at,
  });
  emitCanonicalFromBusinessDataReason(businessId, reason);
}

export function emitVerificationUpdated(
  businessId: string,
  verificationStatus: "pending" | "verified" | "rejected"
): void {
  const io = getSocketIO();
  if (!io) return;
  const payload = { businessId, verificationStatus, at: new Date().toISOString() };
  io.to(`business:${businessId}`).emit("verification_updated", payload);
  io.to("platform").emit("platform_verification_updated", payload);
}

/** Broad platform-admin refresh (stats, business lists). */
export function emitPlatformDataUpdated(reason: string): void {
  const io = getSocketIO();
  if (!io) return;
  io.to("platform").emit("platform_data_updated", { reason, at: new Date().toISOString() });
}

/** Lightweight platform-admin refresh (stat cards + charts only). */
export function emitPlatformMetricsUpdated(reason: string): void {
  const io = getSocketIO();
  if (!io) return;
  io.to("platform").emit("platform_metrics_updated", { reason, at: new Date().toISOString() });
}

export function emitNotificationCreated(
  userId: string,
  payload: { notification: unknown; unreadCount: number },
  businessId?: string | null,
): void {
  const io = getSocketIO();
  if (!io) return;
  const legacy = {
    ...payload,
    at: new Date().toISOString(),
  };
  io.to(`user:${userId}`).emit("notification_created", legacy);
  emitNotificationCreatedCanonical(userId, businessId ?? null, legacy);
}

export function emitNotificationUnreadCount(userId: string, unreadCount: number): void {
  const io = getSocketIO();
  if (!io) return;
  io.to(`user:${userId}`).emit("notification_unread_count", {
    unreadCount,
    at: new Date().toISOString(),
  });
}
