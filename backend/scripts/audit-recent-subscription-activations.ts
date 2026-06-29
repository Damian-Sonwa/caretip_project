import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";
import { resolveSubscriptionEntitlements } from "../src/services/subscriptionEntitlement.service.js";
import { getBillingStatusForBusiness } from "../src/services/managerBilling.service.js";

async function main() {
  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "desc" },
    take: 15,
    select: {
      id: true,
      name: true,
      createdAt: true,
      stripeCustomerId: true,
      subscriptionTier: true,
      userId: true,
      subscription: {
        select: {
          id: true,
          planKey: true,
          status: true,
          stripeSubscriptionId: true,
          createdAt: true,
        },
      },
    },
  });

  console.log("=== Recent businesses (subscription activation audit) ===\n");
  for (const b of businesses) {
    const ent = await resolveSubscriptionEntitlements(b.id);
    const billing = await getBillingStatusForBusiness(b.id);
    const events = await prisma.subscriptionEvent.findMany({
      where: {
        OR: [
          { subscriptionId: b.subscription?.id ?? undefined },
          {
            payload: { path: ["sessionId"], string_contains: "" },
          },
        ],
      },
      orderBy: { occurredAt: "desc" },
      take: 5,
      select: {
        auditType: true,
        processingResult: true,
        payload: true,
        occurredAt: true,
        processingError: true,
      },
    });

    const recentEvents = await prisma.subscriptionEvent.findMany({
      orderBy: { occurredAt: "desc" },
      take: 200,
      select: {
        auditType: true,
        processingResult: true,
        payload: true,
        occurredAt: true,
        processingError: true,
        subscriptionId: true,
      },
    });
    const bizEvents = recentEvents.filter((e) => {
      const p = JSON.stringify(e.payload ?? {});
      return p.includes(b.id) || e.subscriptionId === b.subscription?.id;
    });

    console.log("---");
    console.log("businessId:", b.id);
    console.log("userId:", b.userId);
    console.log("createdAt:", b.createdAt.toISOString());
    console.log("stripeCustomerId:", b.stripeCustomerId);
    console.log("mirror:", b.subscription ? {
      planKey: b.subscription.planKey,
      status: b.subscription.status,
      stripeSubscriptionId: b.subscription.stripeSubscriptionId,
    } : "NONE");
    console.log("entitlements:", {
      status: ent.status,
      plan: ent.plan,
      hasActive: ent.hasActiveEntitlements,
    });
    console.log("billing:", {
      status: billing.status,
      planKey: billing.planKey,
      hasStripeBilling: billing.hasStripeBilling,
    });
    console.log("recent webhook events for business:", bizEvents.length);
    for (const e of bizEvents.slice(0, 8)) {
      console.log(
        `  ${e.occurredAt.toISOString()} ${e.auditType} ${e.processingResult}`,
        e.processingError ?? "",
        JSON.stringify(e.payload),
      );
    }
    console.log("");
  }

  console.log("\n=== Latest ignored/failed checkout events (any business) ===");
  const ignored = await prisma.subscriptionEvent.findMany({
    where: {
      auditType: { in: ["checkout_session_completed", "stripe_subscription_created", "stripe_subscription_updated"] },
      processingResult: { in: ["ignored", "failed"] },
    },
    orderBy: { occurredAt: "desc" },
    take: 15,
  });
  for (const e of ignored) {
    console.log(e.occurredAt.toISOString(), e.auditType, e.processingResult, e.processingError ?? "", JSON.stringify(e.payload));
  }
}

main().finally(() => prisma.$disconnect());
