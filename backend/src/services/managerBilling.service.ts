import type {
  BillingCycle,
  BusinessSubscriptionTier,
  SubscriptionPlanKey,
  SubscriptionStatus,
} from "@prisma/client";
import { isSubscriptionBillingEnabled } from "../config/featureFlags.js";
import { prisma } from "../prisma.js";
import {
  createBillingPortalSession,
  createPlatformSubscriptionCheckoutSession,
  scheduleStripeSubscriptionCancelAtPeriodEnd,
} from "./stripeBilling.service.js";
import { isStripeConfigured } from "./stripe.service.js";

export type BillingStatusDto = {
  planKey: SubscriptionPlanKey;
  billingCycle: BillingCycle;
  status: SubscriptionStatus;
  trialEndsAt: string | null;
  currentPeriodEnd: string | null;
  renewalDate: string | null;
  cancelAtPeriodEnd: boolean;
  cancellationEffective: string | null;
  hasStripeBilling: boolean;
  stripeCustomerId: string | null;
  subscriptionCreatedAt: string;
  syncedAt: string;
  subscriptionTier: BusinessSubscriptionTier;
  billingEnabled: boolean;
  stripeConfigured: boolean;
};

export type BillingTimelineEventDto = {
  id: string;
  auditType: string;
  occurredAt: string;
  processingResult: string;
  payload: Record<string, unknown> | null;
};

function iso(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

const TIMELINE_AUDIT_TYPES = new Set([
  "subscription_created",
  "subscription_plan_changed",
  "stripe_subscription_created",
  "stripe_subscription_updated",
  "stripe_subscription_deleted",
  "invoice_payment_succeeded",
  "payment_failed",
  "checkout_session_completed",
]);

export async function getBillingStatusForBusiness(businessId: string): Promise<BillingStatusDto | null> {
  const row = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      subscriptionTier: true,
      subscription: {
        select: {
          planKey: true,
          billingCycle: true,
          status: true,
          trialEndsAt: true,
          currentPeriodEnd: true,
          renewalDate: true,
          cancelAtPeriodEnd: true,
          cancellationEffective: true,
          stripeSubscriptionId: true,
          stripeCustomerId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!row?.subscription) return null;

  const sub = row.subscription;

  return {
    planKey: sub.planKey,
    billingCycle: sub.billingCycle,
    status: sub.status,
    trialEndsAt: iso(sub.trialEndsAt),
    currentPeriodEnd: iso(sub.currentPeriodEnd),
    renewalDate: iso(sub.renewalDate),
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    cancellationEffective: iso(sub.cancellationEffective),
    hasStripeBilling: Boolean(sub.stripeSubscriptionId),
    stripeCustomerId: sub.stripeCustomerId,
    subscriptionCreatedAt: sub.createdAt.toISOString(),
    syncedAt: sub.updatedAt.toISOString(),
    subscriptionTier: row.subscriptionTier,
    billingEnabled: isSubscriptionBillingEnabled(),
    stripeConfigured: isStripeConfigured(),
  };
}

export async function getBillingTimelineForBusiness(
  businessId: string,
  limit = 25,
): Promise<BillingTimelineEventDto[]> {
  const subscription = await prisma.subscription.findUnique({
    where: { businessId },
    select: { id: true },
  });
  if (!subscription) return [];

  const events = await prisma.subscriptionEvent.findMany({
    where: {
      subscriptionId: subscription.id,
      auditType: { in: [...TIMELINE_AUDIT_TYPES] },
    },
    orderBy: { occurredAt: "desc" },
    take: limit,
    select: {
      id: true,
      auditType: true,
      occurredAt: true,
      processingResult: true,
      payload: true,
    },
  });

  return events.map((e) => ({
    id: e.id,
    auditType: e.auditType,
    occurredAt: e.occurredAt.toISOString(),
    processingResult: e.processingResult,
    payload:
      e.payload && typeof e.payload === "object" && !Array.isArray(e.payload)
        ? (e.payload as Record<string, unknown>)
        : null,
  }));
}

export async function createManagerCheckoutSession(params: {
  businessId: string;
  managerEmail: string;
  businessName: string;
  planKey: SubscriptionPlanKey;
  billingCycle?: "monthly" | "yearly";
}): Promise<{ sessionId: string; url: string | null }> {
  const subscription = await prisma.subscription.findUnique({
    where: { businessId: params.businessId },
    select: { id: true },
  });
  if (!subscription) {
    throw new Error("Subscription mirror not found");
  }

  return createPlatformSubscriptionCheckoutSession({
    businessId: params.businessId,
    subscriptionId: subscription.id,
    managerEmail: params.managerEmail,
    businessName: params.businessName,
    planKey: params.planKey,
    billingCycle: params.billingCycle,
  });
}

export async function createManagerPortalSession(params: {
  stripeCustomerId: string;
}): Promise<{ url: string }> {
  return createBillingPortalSession({ stripeCustomerId: params.stripeCustomerId });
}

export async function scheduleManagerCancelAtPeriodEnd(params: {
  businessId: string;
}): Promise<{
  cancelAtPeriodEnd: boolean;
  cancellationEffective: string | null;
}> {
  const subscription = await prisma.subscription.findUnique({
    where: { businessId: params.businessId },
    select: { stripeSubscriptionId: true },
  });
  if (!subscription?.stripeSubscriptionId) {
    throw new Error("No active Stripe subscription to cancel");
  }

  const updated = await scheduleStripeSubscriptionCancelAtPeriodEnd(subscription.stripeSubscriptionId);
  const effective =
    updated.cancel_at_period_end && updated.current_period_end
      ? new Date(updated.current_period_end * 1000).toISOString()
      : null;

  return {
    cancelAtPeriodEnd: updated.cancel_at_period_end === true,
    cancellationEffective: effective,
  };
}
