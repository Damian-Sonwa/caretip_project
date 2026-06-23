import { prisma } from "../../prisma.js";
import {
  STRIPE_BILLING_AUDIT_TYPES,
  SUBSCRIPTION_AUDIT_TYPES,
} from "../../lib/subscription/subscriptionAuditTypes.js";

export type SubscriptionIntelligence = {
  periodDays: number;
  upgrades: number;
  downgrades: number;
  cancellationsScheduled: number;
  paymentFailures: number;
  renewalsSucceeded: number;
  activeSubscriptions: number;
  cancelAtPeriodEnd: number;
  trialing: number;
  pastDue: number;
  byTier: { basic: number; premium: number; enterprise: number };
};

/** Sprint 7F — subscription lifecycle metrics from mirror + audit events. */
export async function getSubscriptionIntelligence(days = 30): Promise<SubscriptionIntelligence> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [events, subs, tierCounts] = await Promise.all([
    prisma.subscriptionEvent.findMany({
      where: { occurredAt: { gte: since } },
      select: { auditType: true, payload: true },
    }),
    prisma.subscription.findMany({
      select: { status: true, cancelAtPeriodEnd: true, planKey: true },
    }),
    prisma.business.groupBy({
      by: ["subscriptionTier"],
      _count: { _all: true },
    }),
  ]);

  let upgrades = 0;
  let downgrades = 0;
  let cancellationsScheduled = 0;

  for (const e of events) {
    if (e.auditType === SUBSCRIPTION_AUDIT_TYPES.planChanged) {
      const p = e.payload as { previousPlanKey?: string; planKey?: string } | null;
      if (p?.previousPlanKey && p?.planKey) {
        const order = { basic: 0, premium: 1, enterprise: 2 };
        const prev = order[p.previousPlanKey as keyof typeof order] ?? 0;
        const next = order[p.planKey as keyof typeof order] ?? 0;
        if (next > prev) upgrades += 1;
        if (next < prev) downgrades += 1;
      }
    }
    if (
      e.auditType === STRIPE_BILLING_AUDIT_TYPES.subscriptionUpdated &&
      (e.payload as { cancelAtPeriodEnd?: boolean } | null)?.cancelAtPeriodEnd
    ) {
      cancellationsScheduled += 1;
    }
  }

  const byTier = { basic: 0, premium: 0, enterprise: 0 };
  for (const row of tierCounts) {
    byTier[row.subscriptionTier] = row._count._all;
  }

  return {
    periodDays: days,
    upgrades,
    downgrades,
    cancellationsScheduled,
    paymentFailures: events.filter((e) => e.auditType === STRIPE_BILLING_AUDIT_TYPES.invoicePaymentFailed)
      .length,
    renewalsSucceeded: events.filter(
      (e) => e.auditType === STRIPE_BILLING_AUDIT_TYPES.invoicePaymentSucceeded,
    ).length,
    activeSubscriptions: subs.filter((s) => s.status === "active").length,
    cancelAtPeriodEnd: subs.filter((s) => s.cancelAtPeriodEnd).length,
    trialing: subs.filter((s) => s.status === "trialing").length,
    pastDue: subs.filter((s) => s.status === "past_due").length,
    byTier,
  };
}
