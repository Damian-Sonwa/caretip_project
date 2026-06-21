/**
 * In-process checkout funnel counters + structured logs.
 * Operational visibility only — no ledger, analytics, or payout side effects.
 */

export type CheckoutFunnelEventType =
  | "started"
  | "completed"
  | "expired"
  | "abandoned";

export type CheckoutFunnelEventPayload = {
  sessionId: string;
  employeeId?: string | null;
  businessId?: string | null;
  paymentIntentId?: string | null;
  amountEur?: number | null;
  paymentStatus?: string | null;
  reason?: string | null;
};

type CounterSnapshot = Record<CheckoutFunnelEventType, number>;

const counters: CounterSnapshot = {
  started: 0,
  completed: 0,
  expired: 0,
  abandoned: 0,
};

let lastEventAt: string | null = null;
let lastEventType: CheckoutFunnelEventType | null = null;

/** Record a checkout funnel event (logging + in-process counter). */
export function recordCheckoutFunnelEvent(
  type: CheckoutFunnelEventType,
  payload: CheckoutFunnelEventPayload,
): void {
  counters[type] += 1;
  lastEventAt = new Date().toISOString();
  lastEventType = type;

  console.info("[checkout.funnel]", {
    type,
    at: lastEventAt,
    sessionId: payload.sessionId,
    employeeId: payload.employeeId ?? null,
    businessId: payload.businessId ?? null,
    paymentIntentId: payload.paymentIntentId ?? null,
    amountEur: payload.amountEur ?? null,
    paymentStatus: payload.paymentStatus ?? null,
    reason: payload.reason ?? null,
    counters: { ...counters },
  });
}

/** Snapshot for diagnostics / admin probes (no DB). */
export function getCheckoutFunnelMetricsSnapshot(): {
  counters: CounterSnapshot;
  lastEventAt: string | null;
  lastEventType: CheckoutFunnelEventType | null;
} {
  return {
    counters: { ...counters },
    lastEventAt,
    lastEventType,
  };
}

/** Stripe Checkout session expired without a paid completion. */
export function recordCheckoutSessionExpired(session: {
  id: string;
  payment_status?: string | null;
  metadata?: Record<string, string> | null;
}): void {
  const md = session.metadata ?? {};
  recordCheckoutFunnelEvent("expired", {
    sessionId: session.id,
    employeeId: md.employeeId ?? null,
    businessId: md.businessId ?? null,
    paymentStatus: session.payment_status ?? null,
    reason: "checkout.session.expired",
  });

  if (session.payment_status !== "paid") {
    recordCheckoutFunnelEvent("abandoned", {
      sessionId: session.id,
      employeeId: md.employeeId ?? null,
      businessId: md.businessId ?? null,
      paymentStatus: session.payment_status ?? null,
      reason: "expired_unpaid",
    });
  }
}
