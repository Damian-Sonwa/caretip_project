/**
 * One-shot trace: subscription state from DB mirror → entitlement resolver → profile DTO shape.
 * Usage: npx tsx backend/scripts/trace-trial-activation.ts [businessId]
 */
import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";
import { resolveSubscriptionEntitlements } from "../src/services/subscriptionEntitlement.service.js";
import { getManagerBusinessProfileById } from "../src/services/business.service.js";
import { getBillingStatusForBusiness } from "../src/services/managerBilling.service.js";
import { getStripeClient, isStripeConfigured } from "../src/services/stripe.service.js";

const businessId = process.argv[2] ?? "cmqv0eju4000ju790n3cy6uhp";

async function main() {
  console.log("=== TRIAL ACTIVATION TRACE ===");
  console.log("businessId:", businessId);
  console.log("");

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      name: true,
      stripeCustomerId: true,
      subscriptionTier: true,
      userId: true,
      subscription: {
        select: {
          id: true,
          planKey: true,
          status: true,
          trialStartedAt: true,
          trialEndsAt: true,
          isTrial: true,
          stripeSubscriptionId: true,
          stripeCustomerId: true,
          stripePriceId: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  if (!business) {
    console.log("❌ Business not found");
    process.exit(1);
  }

  console.log("--- STAGE 3: MIRROR (database) ---");
  if (!business.subscription) {
    console.log("❌ No Subscription mirror row exists for this business");
  } else {
    const s = business.subscription;
    console.log("✓ Subscription row found:", s.id);
    console.log("  planKey:", s.planKey);
    console.log("  status:", s.status);
    console.log("  trialStartedAt:", s.trialStartedAt?.toISOString() ?? null);
    console.log("  trialEndsAt:", s.trialEndsAt?.toISOString() ?? null);
    console.log("  isTrial:", s.isTrial);
    console.log("  stripeSubscriptionId:", s.stripeSubscriptionId);
    console.log("  stripeCustomerId:", s.stripeCustomerId);
    console.log("  stripePriceId:", s.stripePriceId);
    console.log("  createdAt:", s.createdAt.toISOString());
    console.log("  updatedAt:", s.updatedAt.toISOString());
  }
  console.log("  Business.subscriptionTier (dual-write):", business.subscriptionTier);
  console.log("  Business.stripeCustomerId:", business.stripeCustomerId);
  console.log("");

  console.log("--- STAGE 2: WEBHOOK EVENTS (subscription_events) ---");
  const events = await prisma.subscriptionEvent.findMany({
    where: business.subscription
      ? { subscriptionId: business.subscription.id }
      : { payload: { path: ["businessId"], equals: businessId } },
    orderBy: { occurredAt: "desc" },
    take: 15,
    select: {
      auditType: true,
      processingResult: true,
      processingError: true,
      stripeEventId: true,
      occurredAt: true,
      payload: true,
    },
  });

  if (events.length === 0) {
    const anyEvents = await prisma.subscriptionEvent.findMany({
      orderBy: { occurredAt: "desc" },
      take: 10,
      select: {
        auditType: true,
        processingResult: true,
        payload: true,
        occurredAt: true,
      },
    });
    console.log("❌ No subscription_events for this business mirror");
    console.log("  Latest 10 events in DB (any business):");
    for (const e of anyEvents) {
      console.log(`  - ${e.occurredAt.toISOString()} ${e.auditType} ${e.processingResult}`, JSON.stringify(e.payload));
    }
  } else {
    for (const e of events) {
      console.log(
        `${e.occurredAt.toISOString()} | ${e.auditType} | ${e.processingResult}`,
        e.processingError ? `error=${e.processingError}` : "",
        JSON.stringify(e.payload),
      );
    }
  }
  console.log("");

  console.log("--- STAGE 1: STRIPE (live API) ---");
  if (!isStripeConfigured()) {
    console.log("⚠ Stripe not configured — skipping live Stripe check");
  } else {
    const stripe = getStripeClient();
    const customerId =
      business.subscription?.stripeCustomerId ?? business.stripeCustomerId;
    if (!customerId) {
      console.log("❌ No Stripe customer ID on business or mirror");
    } else {
      console.log("customerId:", customerId);
      const subs = await stripe.subscriptions.list({ customer: customerId, limit: 5 });
      if (subs.data.length === 0) {
        console.log("❌ Stripe has no subscriptions for this customer");
      } else {
        for (const sub of subs.data) {
          console.log("---");
          console.log("  subscriptionId:", sub.id);
          console.log("  status:", sub.status);
          console.log("  trial_start:", sub.trial_start);
          console.log("  trial_end:", sub.trial_end);
          console.log("  metadata:", JSON.stringify(sub.metadata));
          console.log(
            "  price:",
            sub.items.data[0]?.price?.id,
            sub.items.data[0]?.price?.nickname,
          );
        }
      }
    }
  }
  console.log("");

  console.log("--- STAGE 4: ENTITLEMENT RESOLVER ---");
  const entitlements = await resolveSubscriptionEntitlements(businessId);
  console.log(JSON.stringify(entitlements, null, 2));
  console.log("");

  console.log("--- STAGE 5: PROFILE API (getManagerBusinessProfileById) ---");
  const profile = await getManagerBusinessProfileById(businessId);
  if (!profile) {
    console.log("❌ Profile null");
  } else {
    console.log({
      subscriptionTier: profile.subscriptionTier,
      subscriptionStatus: profile.subscriptionStatus,
      plan: profile.plan,
      hasActiveSubscription: profile.hasActiveSubscription,
    });
  }
  console.log("");

  console.log("--- STAGE 5b: BILLING API (getBillingStatusForBusiness) ---");
  const billing = await getBillingStatusForBusiness(businessId);
  console.log({
    planKey: billing.planKey,
    status: billing.status,
    isTrial: billing.isTrial,
    hasStripeBilling: billing.hasStripeBilling,
    subscriptionTier: billing.subscriptionTier,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
