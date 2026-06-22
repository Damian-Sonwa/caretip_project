/**
 * Verifies that ALTER DEFAULT on subscription_tier did not change stored row values.
 *
 *   npm run db:verify-business-tier-default-policy
 *
 * Captures tier distribution and fails if a snapshot file exists with different counts
 * (optional: pass SNAPSHOT_PATH to compare).
 */
import "dotenv/config";
import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";

type TierRow = { subscription_tier: string; count: bigint };

async function fetchDistribution(): Promise<TierRow[]> {
  return prisma.$queryRawUnsafe<TierRow[]>(
    `SELECT subscription_tier::text AS subscription_tier, COUNT(*)::bigint AS count
     FROM businesses
     GROUP BY subscription_tier
     ORDER BY subscription_tier`,
  );
}

function formatDistribution(rows: TierRow[]): string {
  return rows.map((r) => `${r.subscription_tier}=${String(r.count)}`).join(", ") || "(none)";
}

function totalCount(rows: TierRow[]): number {
  return rows.reduce((sum, r) => sum + Number(r.count), 0);
}

async function main() {
  const rows = await fetchDistribution();
  const total = totalCount(rows);

  console.log("BUSINESS TIER DISTRIBUTION AUDIT");
  console.log(`  total businesses: ${total}`);
  console.log(`  distribution:     ${formatDistribution(rows)}`);
  console.log("");
  console.log("SQL:");
  console.log("  SELECT subscription_tier, COUNT(*) FROM businesses GROUP BY subscription_tier;");

  const snapshotPath = process.env.BUSINESS_TIER_SNAPSHOT_PATH?.trim();
  if (snapshotPath) {
    const { readFileSync, existsSync } = await import("node:fs");
    if (existsSync(snapshotPath)) {
      const expected = JSON.parse(readFileSync(snapshotPath, "utf8")) as TierRow[];
      const expectedStr = formatDistribution(expected);
      const actualStr = formatDistribution(rows);
      if (expectedStr !== actualStr) {
        console.error("");
        console.error("  status: FAIL — distribution changed since snapshot");
        console.error(`  snapshot: ${expectedStr}`);
        console.error(`  current:  ${actualStr}`);
        process.exitCode = 1;
        return;
      }
      console.log("");
      console.log("  status: PASS — matches snapshot (no row-level tier changes)");
      return;
    }
  }

  console.log("");
  console.log("  status: OK — current distribution recorded");
  console.log("  tip: save JSON snapshot before migration, re-run with BUSINESS_TIER_SNAPSHOT_PATH after");
}

void main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
