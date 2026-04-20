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
  businessId: string;
  currentMonthTotal: number;
  monthlyGoal: number | null;
}

/**
 * Emits only to the employee and business rooms derived from the tip row (server-side).
 */
export function emitNewTip(payload: NewTipPayload): void {
  const io = getSocketIO();
  if (!io) return;

  io.to(`employee:${payload.employeeId}`).emit("new_tip", payload);
  io.to(`business:${payload.businessId}`).emit("new_tip", payload);
  io.to(`employee:${payload.employeeId}`).emit("tip_received", payload);
  io.to(`business:${payload.businessId}`).emit("tip_received", payload);
}
