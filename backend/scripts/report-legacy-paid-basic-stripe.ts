/**
 * Commit 3 — report legacy paid Basic mirrors still linked to Stripe.
 *
 * Read-only. Does not cancel Stripe subscriptions or modify data.
 *
 *   npm run report:legacy-paid-basic-stripe
 */
import "dotenv/config";
import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";

type LegacyRow = {
  businessId: string;
  businessName: string;
  subscriptionId: string;
  planKey: string;
  status: string;
  stripeSubscriptionId: string;
  stripePriceId: string | null;
  stripeCustomerId: string | null;
  managerEmail: string | null;
};

async function main() {
  const rows = await prisma.subscription.findMany({
    where: {
      planKey: "basic",
      stripeSubscriptionId: { not: null },
    },
    select: {
      id: true,
      businessId: true,
      planKey: true,
      status: true,
      stripeSubscriptionId: true,
      stripePriceId: true,
      stripeCustomerId: true,
      business: {
        select: {
          name: true,
          user: { select: { email: true } },
        },
      },
    },
    orderBy: { businessId: "asc" },
  });

  const report: LegacyRow[] = rows.map((row) => ({
    businessId: row.businessId,
    businessName: row.business.name,
    subscriptionId: row.id,
    planKey: row.planKey,
    status: row.status,
    stripeSubscriptionId: row.stripeSubscriptionId!,
    stripePriceId: row.stripePriceId,
    stripeCustomerId: row.stripeCustomerId,
    managerEmail: row.business.user?.email ?? null,
  }));

  console.log("Legacy paid Basic (Stripe-linked) — manual review required\n");
  console.log(`Count: ${report.length}\n`);

  if (report.length === 0) {
    console.log("No businesses with planKey=basic and stripeSubscriptionId set.");
    return;
  }

  for (const row of report) {
    console.log(
      [
        `businessId=${row.businessId}`,
        `name="${row.businessName}"`,
        `email=${row.managerEmail ?? "n/a"}`,
        `status=${row.status}`,
        `stripeSub=${row.stripeSubscriptionId}`,
        `stripePrice=${row.stripePriceId ?? "n/a"}`,
      ].join(" | "),
    );
  }

  console.log("\nRecommended ops: cancel legacy Stripe Basic subs, then run db:migrate-internal-basic.");
}

void main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
