/**
 * Commit 1 — backfill internal Basic subscriptions for existing businesses.
 *
 * Idempotent. Safe to re-run.
 *
 *   npm run db:migrate-internal-basic
 *
 * Cohorts:
 *   • No subscription row → provision internal Basic active
 *   • Ended / not-entitled mirror → downgrade to internal Basic active
 *
 * Skips (unchanged):
 *   • Entitled Pro (premium active/trialing/past_due)
 *   • Entitled Premium (enterprise)
 *   • Legacy paid Basic with Stripe subscription ID (manual ops)
 *
 * Does not modify sponsored_access_grants.
 */
import "dotenv/config";
import "../src/loadEnv.js";
import { BusinessOperationalStatus } from "@prisma/client";
import { prisma } from "../src/prisma.js";
import { isSubscriptionBasicDefaultEnabled } from "../src/config/featureFlags.js";
import { isSubscriptionMirrorEntitled } from "../src/lib/subscription/subscriptionMirrorEntitlement.js";
import {
  downgradeToInternalBasic,
  isInternalBasicSubscription,
  provisionInternalBasicSubscription,
} from "../src/services/subscription.service.js";

type Stats = {
  provisioned: number;
  downgraded: number;
  skippedEntitled: number;
  skippedLegacyPaidBasic: number;
  skippedFlagDisabled: number;
};

function parseBatchSize(): number {
  const raw = process.env.INTERNAL_BASIC_MIGRATION_BATCH_SIZE?.trim();
  if (!raw) return 100;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1 || n > 500) {
    throw new Error("INTERNAL_BASIC_MIGRATION_BATCH_SIZE must be an integer between 1 and 500");
  }
  return n;
}

function isDryRun(): boolean {
  return process.env.INTERNAL_BASIC_MIGRATION_DRY_RUN?.trim().toLowerCase() === "true";
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

function shouldSkipEntitledMirror(sub: {
  planKey: string;
  status: string;
  stripeSubscriptionId: string | null;
  isTrial: boolean;
  cancelAtPeriodEnd: boolean;
  cancellationEffective: Date | null;
  currentPeriodEnd: Date | null;
  canceledAt: Date | null;
}): { skip: boolean; reason?: "entitled" | "legacy_paid_basic" } {
  if (!isSubscriptionMirrorEntitled(sub)) {
    return { skip: false };
  }

  if (isInternalBasicSubscription(sub)) {
    return { skip: true, reason: "entitled" };
  }

  if (sub.planKey === "basic" && sub.stripeSubscriptionId) {
    return { skip: true, reason: "legacy_paid_basic" };
  }

  if (sub.planKey === "premium" || sub.planKey === "enterprise") {
    return { skip: true, reason: "entitled" };
  }

  return { skip: false };
}

async function migrateBusiness(
  businessId: string,
  stats: Stats,
  dryRun: boolean,
): Promise<void> {
  const row = await prisma.business.findUnique({
    where: { id: businessId },
    select: {
      id: true,
      deletedAt: true,
      operationalStatus: true,
      subscription: {
        select: {
          id: true,
          planKey: true,
          status: true,
          stripeSubscriptionId: true,
          isTrial: true,
          cancelAtPeriodEnd: true,
          cancellationEffective: true,
          currentPeriodEnd: true,
          canceledAt: true,
        },
      },
    },
  });

  if (!row || row.deletedAt || row.operationalStatus !== BusinessOperationalStatus.active) {
    return;
  }

  if (!row.subscription) {
    if (dryRun) {
      console.log(`[dry-run] would provision internal Basic: ${businessId}`);
      stats.provisioned += 1;
      return;
    }
    const result = await provisionInternalBasicSubscription(businessId, {
      source: "auto_heal",
    });
    if (!result.skipped) stats.provisioned += 1;
    return;
  }

  const skip = shouldSkipEntitledMirror(row.subscription);
  if (skip.skip) {
    if (skip.reason === "legacy_paid_basic") stats.skippedLegacyPaidBasic += 1;
    else stats.skippedEntitled += 1;
    return;
  }

  if (dryRun) {
    console.log(`[dry-run] would downgrade to internal Basic: ${businessId}`);
    stats.downgraded += 1;
    return;
  }

  await downgradeToInternalBasic({
    subscriptionRowId: row.subscription.id,
    businessId,
    reason: "migration_backfill",
    auditPayload: { migration: "internal_basic_commit_1" },
  });
  stats.downgraded += 1;
}

async function main() {
  if (!isSubscriptionBasicDefaultEnabled()) {
    console.error(
      "SUBSCRIPTION_BASIC_DEFAULT_ENABLED is false — enable before running migration, or set explicitly for this run.",
    );
    process.exitCode = 1;
    return;
  }

  if (!(await subscriptionsTableExists())) {
    console.error("Table `subscriptions` does not exist. Apply migrations first.");
    process.exitCode = 1;
    return;
  }

  const batchSize = parseBatchSize();
  const dryRun = isDryRun();
  const stats: Stats = {
    provisioned: 0,
    downgraded: 0,
    skippedEntitled: 0,
    skippedLegacyPaidBasic: 0,
    skippedFlagDisabled: 0,
  };

  if (dryRun) {
    console.log("DRY RUN — no writes will be performed.\n");
  }

  let cursor: string | undefined;
  let batchNumber = 0;

  for (;;) {
    const businesses = await prisma.business.findMany({
      where: {
        deletedAt: null,
        operationalStatus: BusinessOperationalStatus.active,
      },
      select: { id: true },
      orderBy: { id: "asc" },
      take: batchSize,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });

    if (businesses.length === 0) break;

    batchNumber += 1;
    for (const business of businesses) {
      await migrateBusiness(business.id, stats, dryRun);
    }

    cursor = businesses[businesses.length - 1]?.id;
    console.log(
      `Batch ${batchNumber}: processed ${businesses.length} business(es) — ` +
        `provisioned=${stats.provisioned}, downgraded=${stats.downgraded}, ` +
        `skippedEntitled=${stats.skippedEntitled}, skippedLegacyPaidBasic=${stats.skippedLegacyPaidBasic}`,
    );

    if (businesses.length < batchSize) break;
  }

  console.log("\nInternal Basic migration complete.");
  console.log(`  provisioned:            ${stats.provisioned}`);
  console.log(`  downgraded:             ${stats.downgraded}`);
  console.log(`  skipped (entitled):     ${stats.skippedEntitled}`);
  console.log(`  skipped (legacy Basic): ${stats.skippedLegacyPaidBasic}`);
  if (dryRun) {
    console.log("  (dry run — no changes written)");
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
