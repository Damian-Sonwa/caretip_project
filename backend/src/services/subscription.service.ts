import {
  BillingCycle,
  BusinessSubscriptionTier,
  SubscriptionEventProcessingResult,
  SubscriptionPlanKey,
  SubscriptionStatus,
  TrialSource,
  type Prisma,
} from "@prisma/client";
import type Stripe from "stripe";
import {
  mapBusinessTierToPlanKey,
  mapPlanKeyToBusinessTier,
} from "../lib/subscription/mapSubscriptionPlanKey.js";
import { mapStripePriceToPlanKey } from "../lib/subscription/mapStripePriceToPlanKey.js";
import { mapStripeSubscriptionStatus } from "../lib/subscription/mapStripeSubscriptionStatus.js";
import {
  STRIPE_BILLING_AUDIT_TYPES,
  SUBSCRIPTION_AUDIT_TYPES,
  type SubscriptionMirrorSource,
} from "../lib/subscription/subscriptionAuditTypes.js";
import { prisma } from "../prisma.js";

export type { SubscriptionMirrorSource };

export type StripeMirrorSnapshot = {
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripePriceId: string | null;
  planKey: SubscriptionPlanKey;
  status: SubscriptionStatus;
  billingCycle: BillingCycle;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  renewalDate: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  cancellationEffective: Date | null;
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
  trialSource: TrialSource | null;
};

function unixToDate(seconds: number | null | undefined): Date | null {
  if (seconds == null || !Number.isFinite(seconds)) return null;
  return new Date(seconds * 1000);
}

function stripeCustomerId(customer: Stripe.Subscription["customer"]): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id ?? null;
}

function primaryStripePrice(sub: Stripe.Subscription): Stripe.Price | null {
  const item = sub.items?.data?.[0];
  if (!item?.price) return null;
  return typeof item.price === "string" ? null : item.price;
}

/** Build mirror fields from a Stripe Subscription object. */
export function buildMirrorSnapshotFromStripeSubscription(
  sub: Stripe.Subscription,
): StripeMirrorSnapshot {
  const price = primaryStripePrice(sub);
  const rawPrice = sub.items?.data?.[0]?.price;
  if (!rawPrice) {
    throw new Error("Stripe subscription missing price");
  }
  const planKey = mapStripePriceToPlanKey(price ?? rawPrice);
  const { status } = mapStripeSubscriptionStatus(sub.status);
  const periodEnd = unixToDate(sub.current_period_end);
  const cancelAtPeriodEnd = sub.cancel_at_period_end === true;

  let cancellationEffective: Date | null = null;
  if (cancelAtPeriodEnd && periodEnd) {
    cancellationEffective = periodEnd;
  } else if (sub.canceled_at) {
    cancellationEffective = unixToDate(sub.canceled_at);
  }

  const interval = price?.recurring?.interval;
  const billingCycle = interval === "year" ? BillingCycle.yearly : BillingCycle.monthly;

  const customerId = stripeCustomerId(sub.customer);
  if (!customerId) {
    throw new Error("Stripe subscription missing customer id");
  }

  return {
    stripeSubscriptionId: sub.id,
    stripeCustomerId: customerId,
    stripePriceId: price?.id ?? null,
    planKey,
    status,
    billingCycle,
    currentPeriodStart: unixToDate(sub.current_period_start),
    currentPeriodEnd: periodEnd,
    renewalDate: periodEnd,
    cancelAtPeriodEnd,
    canceledAt: unixToDate(sub.canceled_at),
    cancellationEffective,
    trialStartedAt: unixToDate(sub.trial_start),
    trialEndsAt: unixToDate(sub.trial_end),
    trialSource: sub.trial_end ? TrialSource.stripe : null,
  };
}

/**
 * Resolve Business.subscriptionTier dual-write from mirror state.
 * Never downgrade while cancel_at_period_end is active and period not ended.
 */
export function resolveBusinessTierDualWrite(snapshot: StripeMirrorSnapshot): BusinessSubscriptionTier | null {
  const now = new Date();

  if (snapshot.cancelAtPeriodEnd) {
    const effective = snapshot.cancellationEffective ?? snapshot.currentPeriodEnd;
    if (effective && effective > now) {
      return null;
    }
    if (effective && effective <= now) {
      return BusinessSubscriptionTier.basic;
    }
    return null;
  }

  if (snapshot.status === SubscriptionStatus.canceled) {
    const effective = snapshot.cancellationEffective ?? snapshot.currentPeriodEnd ?? snapshot.canceledAt;
    if (effective && effective > now) {
      return null;
    }
    return BusinessSubscriptionTier.basic;
  }

  if (
    snapshot.status === SubscriptionStatus.active ||
    snapshot.status === SubscriptionStatus.trialing ||
    snapshot.status === SubscriptionStatus.past_due ||
    snapshot.status === SubscriptionStatus.unpaid ||
    snapshot.status === SubscriptionStatus.incomplete
  ) {
    return mapPlanKeyToBusinessTier(snapshot.planKey);
  }

  return null;
}

/** Nested `subscription.create` payload for Business create trees (signup / auto-heal). */
export function buildNestedSubscriptionCreateData(params: {
  subscriptionTier: BusinessSubscriptionTier;
  source: SubscriptionMirrorSource;
}): Prisma.SubscriptionCreateWithoutBusinessInput {
  const planKey = mapBusinessTierToPlanKey(params.subscriptionTier);
  const now = new Date();

  return {
    planKey,
    status: SubscriptionStatus.active,
    billingCycle: BillingCycle.monthly,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    platformFeeCents: null,
    events: {
      create: createSubscriptionAuditEventData({
        auditType: SUBSCRIPTION_AUDIT_TYPES.created,
        source: params.source,
        payload: {
          planKey,
          subscriptionTier: params.subscriptionTier,
          status: SubscriptionStatus.active,
        },
        occurredAt: now,
      }),
    },
  };
}

export type SubscriptionAuditType =
  | typeof SUBSCRIPTION_AUDIT_TYPES.created
  | typeof SUBSCRIPTION_AUDIT_TYPES.planChanged
  | (typeof STRIPE_BILLING_AUDIT_TYPES)[keyof typeof STRIPE_BILLING_AUDIT_TYPES];

/** Shape for `subscriptionEvent.create` (nested or standalone). */
export function createSubscriptionAuditEventData(params: {
  auditType: SubscriptionAuditType;
  source?: SubscriptionMirrorSource;
  payload: Record<string, unknown>;
  occurredAt?: Date;
  processingResult?: SubscriptionEventProcessingResult;
  processingError?: string | null;
  stripeEventId?: string | null;
}): Prisma.SubscriptionEventCreateWithoutSubscriptionInput {
  const now = params.occurredAt ?? new Date();

  return {
    auditType: params.auditType,
    type: params.auditType,
    stripeEventId: params.stripeEventId ?? null,
    processingResult: params.processingResult ?? SubscriptionEventProcessingResult.processed,
    processingError: params.processingError ?? null,
    payload: {
      ...params.payload,
      ...(params.source ? { source: params.source } : {}),
    },
    occurredAt: now,
    processedAt: now,
  };
}

/** Apply Stripe snapshot to mirror + optional business tier dual-write + audit event. */
export async function applyStripeMirrorTransactional(params: {
  subscriptionRowId: string;
  businessId: string;
  snapshot: StripeMirrorSnapshot;
  auditType: SubscriptionAuditType;
  stripeEventId: string;
  auditPayload: Record<string, unknown>;
}): Promise<void> {
  const tierUpdate = resolveBusinessTierDualWrite(params.snapshot);
  const eventData = createSubscriptionAuditEventData({
    auditType: params.auditType,
    payload: params.auditPayload,
    stripeEventId: params.stripeEventId,
    processingResult: SubscriptionEventProcessingResult.processed,
  });

  const updates: Prisma.PrismaPromise<unknown>[] = [
    prisma.subscription.update({
      where: { id: params.subscriptionRowId },
      data: {
        stripeSubscriptionId: params.snapshot.stripeSubscriptionId,
        stripeCustomerId: params.snapshot.stripeCustomerId,
        stripePriceId: params.snapshot.stripePriceId,
        planKey: params.snapshot.planKey,
        status: params.snapshot.status,
        billingCycle: params.snapshot.billingCycle,
        currentPeriodStart: params.snapshot.currentPeriodStart,
        currentPeriodEnd: params.snapshot.currentPeriodEnd,
        renewalDate: params.snapshot.renewalDate,
        cancelAtPeriodEnd: params.snapshot.cancelAtPeriodEnd,
        canceledAt: params.snapshot.canceledAt,
        cancellationEffective: params.snapshot.cancellationEffective,
        trialStartedAt: params.snapshot.trialStartedAt,
        trialEndsAt: params.snapshot.trialEndsAt,
        trialSource: params.snapshot.trialSource,
      },
    }),
    prisma.subscriptionEvent.create({
      data: {
        subscriptionId: params.subscriptionRowId,
        ...eventData,
      },
    }),
  ];

  if (tierUpdate) {
    updates.unshift(
      prisma.business.update({
        where: { id: params.businessId },
        data: { subscriptionTier: tierUpdate },
      }),
    );
  }

  await prisma.$transaction(updates);
}

/** Platform admin tier change — atomic business tier, mirror planKey, and audit event. */
export async function updateSubscriptionMirrorPlanTransactional(params: {
  businessId: string;
  newTier: BusinessSubscriptionTier;
  previousTier: BusinessSubscriptionTier;
  actorUserId: string;
}): Promise<void> {
  const subscription = await prisma.subscription.findUnique({
    where: { businessId: params.businessId },
    select: { id: true },
  });
  if (!subscription) {
    throw new Error("Subscription mirror not found for business");
  }

  const newPlanKey = mapBusinessTierToPlanKey(params.newTier);
  const eventData = createSubscriptionAuditEventData({
    auditType: SUBSCRIPTION_AUDIT_TYPES.planChanged,
    payload: {
      previousTier: params.previousTier,
      newTier: params.newTier,
      previousPlanKey: mapBusinessTierToPlanKey(params.previousTier),
      newPlanKey,
      actorUserId: params.actorUserId,
    },
  });

  await prisma.$transaction([
    prisma.business.update({
      where: { id: params.businessId },
      data: { subscriptionTier: params.newTier },
    }),
    prisma.subscription.update({
      where: { businessId: params.businessId },
      data: { planKey: newPlanKey },
    }),
    prisma.subscriptionEvent.create({
      data: {
        subscriptionId: subscription.id,
        ...eventData,
      },
    }),
  ]);
}

export async function findSubscriptionForStripeBilling(params: {
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
  caretipBusinessId?: string | null;
  caretipSubscriptionId?: string | null;
}) {
  if (params.stripeSubscriptionId) {
    const bySub = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: params.stripeSubscriptionId },
      select: { id: true, businessId: true },
    });
    if (bySub) return bySub;
  }

  if (params.stripeCustomerId) {
    const byCustomer = await prisma.subscription.findFirst({
      where: { stripeCustomerId: params.stripeCustomerId },
      select: { id: true, businessId: true },
    });
    if (byCustomer) return byCustomer;
  }

  if (params.caretipSubscriptionId) {
    const byId = await prisma.subscription.findUnique({
      where: { id: params.caretipSubscriptionId },
      select: { id: true, businessId: true },
    });
    if (byId) return byId;
  }

  if (params.caretipBusinessId) {
    const byBusiness = await prisma.subscription.findUnique({
      where: { businessId: params.caretipBusinessId },
      select: { id: true, businessId: true },
    });
    if (byBusiness) return byBusiness;
  }

  return null;
}
