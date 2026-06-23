import { prisma } from "../../prisma.js";
import { logServerError } from "../../utils/httpErrors.js";

/** Sprint 4F — funnel stages (conversion not exposed in UI until trustworthy). */
export const QR_FUNNEL_EVENT_TYPES = {
  TIP_STARTED: "tip_started",
  PAYMENT_COMPLETED: "payment_completed",
} as const;

export type QrFunnelEventType = (typeof QR_FUNNEL_EVENT_TYPES)[keyof typeof QR_FUNNEL_EVENT_TYPES];

export type RecordQrFunnelEventInput = {
  businessId: string;
  sessionId: string;
  eventType: QrFunnelEventType;
  employeeId?: string | null;
  locationId?: string | null;
  tableId?: string | null;
  transactionId?: string | null;
};

/**
 * Future: link sessionId from scan events → tip_started → payment_completed.
 * Sprint 5+ will wire payment hooks; Sprint 4 establishes persistence only.
 */
export function recordQrFunnelEvent(input: RecordQrFunnelEventInput): void {
  void prisma.qrFunnelEvent
    .create({
      data: {
        businessId: input.businessId,
        sessionId: input.sessionId.slice(0, 64),
        eventType: input.eventType,
        employeeId: input.employeeId ?? null,
        locationId: input.locationId ?? null,
        tableId: input.tableId ?? null,
        transactionId: input.transactionId ?? null,
      },
    })
    .catch((err) => {
      logServerError("recordQrFunnelEvent", err);
    });
}
