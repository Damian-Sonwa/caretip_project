import "dotenv/config";
import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";

async function main() {
  const events = await prisma.subscriptionEvent.findMany({
    where: {
      auditType: {
        in: [
          "checkout_session_completed",
          "stripe_subscription_created",
          "stripe_subscription_updated",
        ],
      },
    },
    orderBy: { occurredAt: "desc" },
    take: 20,
    select: {
      auditType: true,
      processingResult: true,
      occurredAt: true,
      payload: true,
      stripeEventId: true,
    },
  });

  console.log(`\n=== Recent billing webhook events (${events.length}) ===`);
  for (const e of events) {
    const p = e.payload as Record<string, unknown> | null;
    console.log(
      `${e.occurredAt.toISOString()} | ${e.auditType} | ${e.processingResult} | reason=${String(p?.reason ?? "-")} | stripeEvent=…${e.stripeEventId?.slice(-10) ?? "none"}`,
    );
  }

  const trialing = await prisma.subscription.findMany({
    where: { OR: [{ status: "trialing" }, { isTrial: true }] },
    select: {
      businessId: true,
      status: true,
      isTrial: true,
      planKey: true,
      stripeSubscriptionId: true,
      trialEndsAt: true,
    },
    take: 10,
  });
  console.log(`\n=== Trialing subscriptions (${trialing.length}) ===`);
  console.log(JSON.stringify(trialing, null, 2));

  const withStripe = await prisma.subscription.findMany({
    where: { stripeSubscriptionId: { not: null } },
    select: {
      businessId: true,
      status: true,
      planKey: true,
      stripeSubscriptionId: true,
      stripeCustomerId: true,
      updatedAt: true,
      business: { select: { subscriptionTier: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });
  console.log(`\n=== Subscriptions linked to Stripe (${withStripe.length}) ===`);
  for (const s of withStripe) {
    console.log(
      JSON.stringify({
        business: s.business.name,
        businessTier: s.business.subscriptionTier,
        mirrorStatus: s.status,
        planKey: s.planKey,
        stripeSub: s.stripeSubscriptionId,
        updatedAt: s.updatedAt.toISOString(),
      }),
    );
  }

  const failedCheckout = await prisma.subscriptionEvent.findMany({
    where: { processingResult: "failed", auditType: "checkout_session_completed" },
    orderBy: { occurredAt: "desc" },
    take: 5,
    select: {
      occurredAt: true,
      processingError: true,
      payload: true,
      stripeEventId: true,
    },
  });
  console.log(`\n=== Failed checkout_session_completed (${failedCheckout.length}) ===`);
  for (const f of failedCheckout) {
    console.log(JSON.stringify(f, null, 2));
  }

  await prisma.$disconnect();
}

void main();
