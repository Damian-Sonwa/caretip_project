/**
 * Phase A — read-only verification for Subscription backfill invariants.
 *
 *   npm run db:verify-subscriptions
 *
 * Exit code 1 when any invariant fails.
 */
import "dotenv/config";
import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";
import { mapBusinessTierToPlanKey } from "../src/lib/subscription/mapSubscriptionPlanKey.js";

type TierCounts = Record<string, number>;

function increment(counts: TierCounts, key: string): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function formatCounts(counts: TierCounts): string {
  const keys = Object.keys(counts).sort();
  if (keys.length === 0) return "(none)";
  return keys.map((k) => `${k}=${counts[k]}`).join(", ");
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

async function main() {
  const failures: string[] = [];

  if (!(await subscriptionsTableExists())) {
    console.log("AUDIT SUMMARY — subscriptions table not deployed yet.");
    console.log("  status: SKIP (migration not applied)");
    process.exitCode = 1;
    return;
  }

  const [businessCount, subscriptionCount] = await Promise.all([
    prisma.business.count(),
    prisma.subscription.count(),
  ]);

  if (businessCount !== subscriptionCount) {
    failures.push(
      `business count (${businessCount}) !== subscription count (${subscriptionCount})`,
    );
  }

  const duplicateBusinessRows = await prisma.$queryRawUnsafe<Array<{ business_id: string; c: bigint }>>(
    `SELECT business_id, COUNT(*)::bigint AS c
     FROM subscriptions
     GROUP BY business_id
     HAVING COUNT(*) > 1`,
  );
  if (duplicateBusinessRows.length > 0) {
    failures.push(
      `duplicate subscriptions for ${duplicateBusinessRows.length} business_id(s): ${duplicateBusinessRows
        .map((r) => r.business_id)
        .join(", ")}`,
    );
  }

  const orphanRows = await prisma.$queryRawUnsafe<Array<{ id: string; business_id: string }>>(
    `SELECT s.id, s.business_id
     FROM subscriptions s
     LEFT JOIN businesses b ON b.id = s.business_id
     WHERE b.id IS NULL`,
  );
  if (orphanRows.length > 0) {
    failures.push(
      `orphan subscriptions (no matching business): ${orphanRows.map((r) => r.id).join(", ")}`,
    );
  }

  const missingSubscriptionBusinesses = await prisma.business.findMany({
    where: { subscription: null },
    select: { id: true },
    take: 20,
  });
  if (missingSubscriptionBusinesses.length > 0) {
    const sample = missingSubscriptionBusinesses.map((b) => b.id).join(", ");
    const suffix =
      missingSubscriptionBusinesses.length === 20 ? " (showing first 20)" : "";
    failures.push(`missing subscriptions for business id(s): ${sample}${suffix}`);
  }

  const tierDistribution: TierCounts = {};
  const planKeyDistribution: TierCounts = {};
  const mismatched: Array<{ businessId: string; tier: string; planKey: string }> = [];

  const businesses = await prisma.business.findMany({
    select: {
      id: true,
      subscriptionTier: true,
      subscription: { select: { planKey: true } },
    },
  });

  for (const business of businesses) {
    increment(tierDistribution, business.subscriptionTier);
    const planKey = business.subscription?.planKey;
    if (planKey) {
      increment(planKeyDistribution, planKey);
      const expected = mapBusinessTierToPlanKey(business.subscriptionTier);
      if (planKey !== expected) {
        mismatched.push({
          businessId: business.id,
          tier: business.subscriptionTier,
          planKey,
        });
      }
    }
  }

  if (mismatched.length > 0) {
    const sample = mismatched
      .slice(0, 10)
      .map((m) => `${m.businessId} (tier=${m.tier}, planKey=${m.planKey})`)
      .join("; ");
    failures.push(
      `planKey !== subscriptionTier mapping for ${mismatched.length} row(s): ${sample}${
        mismatched.length > 10 ? " …" : ""
      }`,
    );
  }

  const tierKeys = Object.keys(tierDistribution).sort();
  const planKeys = Object.keys(planKeyDistribution).sort();
  const distributionMatch =
    tierKeys.length === planKeys.length &&
    tierKeys.every((k) => tierDistribution[k] === planKeyDistribution[k]);

  if (!distributionMatch && subscriptionCount > 0) {
    failures.push(
      `planKey distribution (${formatCounts(planKeyDistribution)}) !== subscriptionTier distribution (${formatCounts(tierDistribution)})`,
    );
  }

  const migrationEventCount = await prisma.subscriptionEvent.count({
    where: { auditType: "migration_backfill" },
  });

  console.log("AUDIT SUMMARY — Subscription Phase A verification");
  console.log(`  businesses:              ${businessCount}`);
  console.log(`  subscriptions:           ${subscriptionCount}`);
  console.log(`  subscriptionTier counts:   ${formatCounts(tierDistribution)}`);
  console.log(`  planKey counts:          ${formatCounts(planKeyDistribution)}`);
  console.log(`  migration_backfill events: ${migrationEventCount}`);
  console.log(`  duplicate business rows: ${duplicateBusinessRows.length}`);
  console.log(`  orphan subscriptions:    ${orphanRows.length}`);
  console.log(`  missing subscriptions:   ${missingSubscriptionBusinesses.length}`);

  if (failures.length === 0) {
    console.log("  status: PASS — all invariants satisfied");
    return;
  }

  console.log("  status: FAIL");
  for (const f of failures) {
    console.log(`  - ${f}`);
  }
  process.exitCode = 1;
}

void main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
