/**
 * Phase A — backfill Subscription rows from Business.subscriptionTier.
 *
 * Idempotent: skips businesses that already have a Subscription row.
 * Resumable: re-run until "Nothing to backfill" — processes only missing rows.
 * Batch-safe: processes businesses in chunks for progress logging; each business is one atomic nested create.
 *
 * Does NOT run on application startup. Invoke manually:
 *   npm run db:backfill-subscriptions
 *
 * Optional env:
 *   SUBSCRIPTION_BACKFILL_BATCH_SIZE=100 (default 100)
 */
import "dotenv/config";
import "../src/loadEnv.js";
import {
  BillingCycle,
  SubscriptionEventProcessingResult,
  SubscriptionStatus,
  type BusinessSubscriptionTier,
} from "@prisma/client";
import { prisma } from "../src/prisma.js";
import { mapBusinessTierToPlanKey } from "../src/lib/subscription/mapSubscriptionPlanKey.js";
import { SUBSCRIPTION_AUDIT_TYPE_MIGRATION_BACKFILL } from "../src/lib/subscription/subscriptionAuditTypes.js";

const MIGRATION_AUDIT_TYPE = SUBSCRIPTION_AUDIT_TYPE_MIGRATION_BACKFILL;

function parseBatchSize(): number {
  const raw = process.env.SUBSCRIPTION_BACKFILL_BATCH_SIZE?.trim();
  if (!raw) return 100;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 1000) {
    throw new Error("SUBSCRIPTION_BACKFILL_BATCH_SIZE must be an integer between 1 and 1000");
  }
  return n;
}

async function subscriptionsTableExists(): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'subscriptions'
    ) AS "exists"`,
  );
  return rows[0]?.exists === true;
}

async function fetchBusinessBatch(batchSize: number): Promise<
  Array<{ id: string; subscriptionTier: BusinessSubscriptionTier }>
> {
  return prisma.business.findMany({
    where: { subscription: null },
    select: { id: true, subscriptionTier: true },
    orderBy: { id: "asc" },
    take: batchSize,
  });
}

async function backfillOneBusiness(
  business: { id: string; subscriptionTier: BusinessSubscriptionTier },
): Promise<void> {
  const now = new Date();

  // Single nested create — no interactive $transaction (required for Supabase transaction pooler / PgBouncer).
  await prisma.subscription.create({
    data: {
      businessId: business.id,
      planKey: mapBusinessTierToPlanKey(business.subscriptionTier),
      status: SubscriptionStatus.active,
      billingCycle: BillingCycle.monthly,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      platformFeeCents: null,
      events: {
        create: {
          auditType: MIGRATION_AUDIT_TYPE,
          type: MIGRATION_AUDIT_TYPE,
          processingResult: SubscriptionEventProcessingResult.processed,
          payload: {
            businessId: business.id,
            sourceSubscriptionTier: business.subscriptionTier,
            planKey: mapBusinessTierToPlanKey(business.subscriptionTier),
            backfillStatus: SubscriptionStatus.active,
          },
          occurredAt: now,
          processedAt: now,
        },
      },
    },
  });
}

async function backfillBatch(
  businesses: Array<{ id: string; subscriptionTier: BusinessSubscriptionTier }>,
): Promise<number> {
  let created = 0;

  for (const business of businesses) {
    await backfillOneBusiness(business);
    created += 1;
  }

  return created;
}

async function main() {
  if (!(await subscriptionsTableExists())) {
    console.error(
      "Table `subscriptions` does not exist. Apply migration first:\n" +
        "  npm run db:migrate:deploy\n" +
        "Or run the SQL in prisma/migrations/20260622120000_subscriptions_phase_a/migration.sql",
    );
    process.exitCode = 1;
    return;
  }

  const batchSize = parseBatchSize();
  let totalCreated = 0;
  let batchNumber = 0;

  for (;;) {
    const batch = await fetchBusinessBatch(batchSize);
    if (batch.length === 0) break;

    batchNumber += 1;
    const created = await backfillBatch(batch);
    totalCreated += created;
    console.log(`Batch ${batchNumber}: backfilled ${created} subscription row(s).`);
  }

  if (totalCreated === 0) {
    console.log("Nothing to backfill — every business already has a Subscription row.");
  } else {
    console.log(`Backfill complete: ${totalCreated} subscription row(s) created across ${batchNumber} batch(es).`);
  }
}

void main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
