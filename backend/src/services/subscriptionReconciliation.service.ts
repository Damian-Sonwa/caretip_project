import { randomUUID } from "node:crypto";
import { isSubscriptionBillingEnabled } from "../config/featureFlags.js";
import { getStripeClient } from "./stripe.service.js";
import { prisma } from "../prisma.js";
import {
  applyStripeMirrorTransactional,
  buildMirrorSnapshotFromStripeSubscription,
} from "./subscription.service.js";
import { mapPlanKeyToBusinessTier } from "../lib/subscription/mapSubscriptionPlanKey.js";
import { STRIPE_BILLING_AUDIT_TYPES } from "../lib/subscription/subscriptionAuditTypes.js";
import { tryActivateSubscriptionFromStripeForBusiness } from "./subscriptionActivation.service.js";

export type SubscriptionDriftRow = {
  subscriptionId: string;
  businessId: string;
  field: string;
  dbValue: string | null;
  stripeValue: string;
};

/** List subscriptions linked to Stripe with potential mirror drift (scaffold). */
export async function findDriftedSubscriptions(limit = 50): Promise<SubscriptionDriftRow[]> {
  if (!isSubscriptionBillingEnabled()) {
    return [];
  }

  const rows = await prisma.subscription.findMany({
    where: { stripeSubscriptionId: { not: null } },
    take: limit,
    select: {
      id: true,
      businessId: true,
      status: true,
      planKey: true,
      stripeSubscriptionId: true,
      business: { select: { subscriptionTier: true } },
    },
  });

  const drifts: SubscriptionDriftRow[] = [];
  const stripe = getStripeClient();

  for (const row of rows) {
    if (!row.stripeSubscriptionId) continue;
    try {
      const sub = await stripe.subscriptions.retrieve(row.stripeSubscriptionId);
      const snapshot = buildMirrorSnapshotFromStripeSubscription(sub);

      if (snapshot.status !== row.status) {
        drifts.push({
          subscriptionId: row.id,
          businessId: row.businessId,
          field: "status",
          dbValue: row.status,
          stripeValue: snapshot.status,
        });
      }
      if (snapshot.planKey !== row.planKey) {
        drifts.push({
          subscriptionId: row.id,
          businessId: row.businessId,
          field: "planKey",
          dbValue: row.planKey,
          stripeValue: snapshot.planKey,
        });
      }
      const expectedTier = mapPlanKeyToBusinessTier(row.planKey);
      if (row.business.subscriptionTier !== expectedTier) {
        drifts.push({
          subscriptionId: row.id,
          businessId: row.businessId,
          field: "subscriptionTier",
          dbValue: row.business.subscriptionTier,
          stripeValue: expectedTier,
        });
      }
    } catch {
      drifts.push({
        subscriptionId: row.id,
        businessId: row.businessId,
        field: "stripe_retrieve",
        dbValue: row.stripeSubscriptionId,
        stripeValue: "error",
      });
    }
  }

  return drifts;
}

/** Repair one subscription mirror from Stripe (Stripe wins). */
export async function reconcileOneSubscription(subscriptionId: string): Promise<boolean> {
  if (!isSubscriptionBillingEnabled()) {
    return false;
  }

  const row = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: { id: true, businessId: true, stripeSubscriptionId: true },
  });
  if (!row?.stripeSubscriptionId) {
    return false;
  }

  const stripe = getStripeClient();
  const sub = await stripe.subscriptions.retrieve(row.stripeSubscriptionId);
  const snapshot = buildMirrorSnapshotFromStripeSubscription(sub);

  await applyStripeMirrorTransactional({
    subscriptionRowId: row.id,
    businessId: row.businessId,
    snapshot,
    auditType: STRIPE_BILLING_AUDIT_TYPES.reconciliationRepair,
    stripeEventId: `internal_reconciliation_${randomUUID()}`,
    auditPayload: {
      source: "reconciliation",
      stripeSubscriptionId: row.stripeSubscriptionId,
    },
  });

  return true;
}

/** Batch reconciliation scaffold — returns count repaired. */
export async function reconcileAllLinkedSubscriptions(limit = 100): Promise<number> {
  const ids = await prisma.subscription.findMany({
    where: { stripeSubscriptionId: { not: null } },
    take: limit,
    select: { id: true },
  });

  let repaired = 0;
  for (const { id } of ids) {
    const ok = await reconcileOneSubscription(id);
    if (ok) repaired += 1;
  }
  return repaired;
}

/**
 * @deprecated Use tryActivateSubscriptionFromStripeForBusiness via checkout sync-status.
 */
export async function reconcileBusinessMirrorFromStripe(
  businessId: string,
): Promise<{ repaired: boolean; reason?: string }> {
  const outcome = await tryActivateSubscriptionFromStripeForBusiness({
    businessId,
    source: "checkout_return_sync",
  });
  if (outcome === "mirror_created" || outcome === "mirror_updated") {
    return { repaired: true };
  }
  return { repaired: false, reason: outcome };
}
