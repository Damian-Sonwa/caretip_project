import { getSocketIO } from "./socketServer.js";

export interface NewTipPayload {
  tip: {
    id: string;
    amount: number;
    status: string;
    createdAt: string;
  };
  employeeId: string;
  employeeName: string;
  /** When set, push notifications skip an employee lookup. */
  employeeUserId?: string;
  businessId: string;
  /** When set, push notifications skip a business lookup. */
  businessManagerUserId?: string;
  currentMonthTotal: number;
  monthlyGoal: number | null;
}

/**
 * Emits only to the employee and business rooms derived from the tip row (server-side).
 */
export function emitNewTip(payload: NewTipPayload): void {
  const io = getSocketIO();
  if (io) {
    io.to(`employee:${payload.employeeId}`).emit("new_tip", payload);
    io.to(`business:${payload.businessId}`).emit("new_tip", payload);
    io.to(`employee:${payload.employeeId}`).emit("tip_received", payload);
    io.to(`business:${payload.businessId}`).emit("tip_received", payload);
  }

  void import("../services/push/notification.triggers.js").then(({ onTipReceived }) => {
    onTipReceived(payload);
  });

  void import("../services/business.service.js").then(({ invalidateBusinessStatsTipCaches }) => {
    invalidateBusinessStatsTipCaches(payload.businessId);
  });
  void import("../services/employeeTipsDashboard.service.js").then(({ invalidateEmployeeDashboardCache }) => {
    invalidateEmployeeDashboardCache(payload.employeeId);
  });
  void import("../services/platform.service.js").then(({ invalidatePlatformMetricsCache }) => {
    invalidatePlatformMetricsCache();
  });
  void import("./socketEmitters.js").then(({ emitPlatformMetricsUpdated }) => {
    emitPlatformMetricsUpdated("new_tip");
  });
}
