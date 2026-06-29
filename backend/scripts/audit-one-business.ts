import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";

const BUSINESS_ID = process.argv[2] ?? "cmqv1z2880007u7a4ggyxvxj5";

async function main() {
  const b = await prisma.business.findUnique({
    where: { id: BUSINESS_ID },
    select: {
      id: true,
      userId: true,
      stripeCustomerId: true,
      subscriptionTier: true,
      subscription: {
        select: {
          id: true,
          planKey: true,
          status: true,
          stripeSubscriptionId: true,
        },
      },
    },
  });
  console.log("business:", JSON.stringify(b, null, 2));

  const events = await prisma.subscriptionEvent.findMany({
    orderBy: { occurredAt: "desc" },
    take: 30,
    select: {
      auditType: true,
      processingResult: true,
      payload: true,
      occurredAt: true,
      stripeEventId: true,
    },
  });
  const related = events.filter((e) => JSON.stringify(e.payload ?? {}).includes(BUSINESS_ID));
  console.log("\nwebhook events mentioning business:", related.length);
  for (const e of related) {
    console.log(e.occurredAt.toISOString(), e.auditType, e.processingResult, JSON.stringify(e.payload));
  }

  console.log("\nSTRIPE_WEBHOOK_SECRET configured:", Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()));
}

main().finally(() => prisma.$disconnect());
