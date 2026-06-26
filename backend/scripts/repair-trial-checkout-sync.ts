/**
 * Repair subscription mirror from Stripe after a failed checkout webhook.
 * Usage: npm run repair:trial-checkout -- [businessId]
 */
import "dotenv/config";
import "../src/loadEnv.js";
import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import { prisma } from "../src/prisma.js";
import { isStripeConfigured } from "../src/services/stripe.service.js";
import {
  applyStripeMirrorTransactional,
  buildMirrorSnapshotFromStripeSubscription,
} from "../src/services/subscription.service.js";
import { STRIPE_BILLING_AUDIT_TYPES } from "../src/lib/subscription/subscriptionAuditTypes.js";

async function findStripeSubscriptionForCustomer(
  stripe: Stripe,
  customerId: string,
): Promise<Stripe.Subscription | null> {
  const list = await stripe.subscriptions.list({
    customer: customerId,
    status: "all",
    limit: 10,
    expand: ["data.items.data.price"],
  });
  const preferred =
    list.data.find((s) => s.status === "trialing") ??
    list.data.find((s) => s.status === "active") ??
    list.data[0];
  return preferred ?? null;
}

async function main(): Promise<void> {
  const businessIdArg = process.argv[2]?.trim();

  if (!isStripeConfigured()) {
    console.error("FAIL: STRIPE_SECRET_KEY is not configured.");
    process.exitCode = 1;
    return;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim());

  let businessId = businessIdArg;
  if (!businessId) {
    const failed = await prisma.subscriptionEvent.findFirst({
      where: {
        auditType: "checkout_session_completed",
        processingResult: "failed",
      },
      orderBy: { occurredAt: "desc" },
      select: { subscriptionId: true },
    });
    if (!failed?.subscriptionId) {
      console.error("FAIL: No failed checkout event with subscriptionId. Pass businessId explicitly.");
      process.exitCode = 1;
      return;
    }
    const subRow = await prisma.subscription.findUnique({
      where: { id: failed.subscriptionId },
      select: { businessId: true },
    });
    businessId = subRow?.businessId;
  }

  if (!businessId) {
    console.error("FAIL: businessId not found.");
    process.exitCode = 1;
    return;
  }

  const row = await prisma.subscription.findUnique({
    where: { businessId },
    select: {
      id: true,
      businessId: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      status: true,
      planKey: true,
      business: { select: { name: true, subscriptionTier: true } },
    },
  });

  if (!row) {
    console.error(`FAIL: No subscription row for business ${businessId}`);
    process.exitCode = 1;
    return;
  }

  console.log(`Repairing business=${row.business.name} (${businessId})`);

  let stripeSubId = row.stripeSubscriptionId;
  if (!stripeSubId && row.stripeCustomerId) {
    const sub = await findStripeSubscriptionForCustomer(stripe, row.stripeCustomerId);
    stripeSubId = sub?.id ?? null;
  }

  if (!stripeSubId && row.stripeCustomerId) {
    console.error("FAIL: No Stripe subscription found for customer", row.stripeCustomerId);
    process.exitCode = 1;
    return;
  }

  if (!stripeSubId) {
    console.error("FAIL: No stripeSubscriptionId or stripeCustomerId on mirror row.");
    process.exitCode = 1;
    return;
  }

  const sub = await stripe.subscriptions.retrieve(stripeSubId, {
    expand: ["items.data.price"],
  });
  const snapshot = buildMirrorSnapshotFromStripeSubscription(sub);

  await applyStripeMirrorTransactional({
    subscriptionRowId: row.id,
    businessId: row.businessId,
    snapshot,
    auditType: STRIPE_BILLING_AUDIT_TYPES.reconciliationRepair,
    stripeEventId: `repair_trial_checkout_${randomUUID()}`,
    auditPayload: {
      source: "repair_trial_checkout",
      stripeSubscriptionId: stripeSubId,
    },
  });

  const updated = await prisma.subscription.findUnique({
    where: { id: row.id },
    select: {
      status: true,
      planKey: true,
      isTrial: true,
      trialStartedAt: true,
      trialEndsAt: true,
      stripeSubscriptionId: true,
      business: { select: { subscriptionTier: true } },
    },
  });

  console.log("\n=== Mirror after repair ===");
  console.log(JSON.stringify(updated, null, 2));
  await prisma.$disconnect();
}

void main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
