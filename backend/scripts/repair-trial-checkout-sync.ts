/**
 * Repair subscription mirror from Stripe after a failed Option A checkout webhook.
 * Creates the initial mirror when none exists, or syncs an existing row from Stripe.
 *
 * Usage: npm run repair:trial-checkout -- [businessId]
 */
import "dotenv/config";
import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";
import { resolveSubscriptionEntitlements } from "../src/services/subscriptionEntitlement.service.js";
import { reconcileBusinessMirrorFromStripe } from "../src/services/subscriptionReconciliation.service.js";

async function findBusinessIdFromIgnoredCheckout(): Promise<string | null> {
  const ignored = await prisma.subscriptionEvent.findFirst({
    where: {
      auditType: "checkout_session_completed",
      processingResult: "ignored",
      payload: { path: ["reason"], equals: "subscription_row_not_found" },
    },
    orderBy: { occurredAt: "desc" },
    select: { payload: true },
  });
  const sessionId = (ignored?.payload as { sessionId?: string } | null)?.sessionId;
  if (!sessionId) return null;

  const { getStripeClient, isStripeConfigured } = await import("../src/services/stripe.service.js");
  if (!isStripeConfigured()) return null;

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const businessId = session.metadata?.caretipBusinessId?.trim();
  return businessId || null;
}

async function main(): Promise<void> {
  let businessId = process.argv[2]?.trim() || null;
  if (!businessId) {
    businessId = await findBusinessIdFromIgnoredCheckout();
  }

  if (!businessId) {
    console.error("FAIL: Pass businessId or ensure a recent ignored checkout_session_completed exists.");
    process.exitCode = 1;
    return;
  }

  console.log(`Repairing Option A mirror for business=${businessId}`);

  const result = await reconcileBusinessMirrorFromStripe(businessId);
  if (!result.repaired) {
    console.error(`FAIL: ${result.reason ?? "unknown"}`);
    process.exitCode = 1;
    return;
  }

  const mirror = await prisma.subscription.findUnique({
    where: { businessId },
    select: {
      planKey: true,
      status: true,
      isTrial: true,
      trialStartedAt: true,
      trialEndsAt: true,
      stripeSubscriptionId: true,
      stripeCustomerId: true,
      business: { select: { subscriptionTier: true, name: true } },
    },
  });

  const entitlements = await resolveSubscriptionEntitlements(businessId);

  console.log("\n=== Mirror after repair ===");
  console.log(JSON.stringify(mirror, null, 2));
  console.log("\n=== Entitlements ===");
  console.log(JSON.stringify(entitlements, null, 2));
  await prisma.$disconnect();
}

void main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
