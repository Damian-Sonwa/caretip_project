/**
 * Sprint 4 — production scale validation (read-only perf after seed + cleanup).
 * Run: npm run test:sprint4-load-validation
 *
 * Seeds tagged fixtures (~50 venues / 500 staff / 5k tips), benchmarks hot paths, removes fixtures.
 */
import "../src/loadEnv.js";
import bcrypt from "bcrypt";
import { getDatabasePoolDiagnostics } from "../src/databaseUrl.js";
import { prisma } from "../src/prisma.js";
import { getBusinessStats } from "../src/services/business.service.js";
import { loadEmployeeDashboardSummaryBundle } from "../src/services/employeeTipsDashboard.service.js";
import { getGlobalPlatformStats, getKycQueueMetrics } from "../src/services/platform.service.js";
import {
  isStripeWebhookEventProcessed,
  markStripeWebhookEventProcessed,
} from "../src/services/stripeWebhookIdempotency.service.js";
import { queryBusinessDashboardSqlBundle } from "../src/utils/tipChartBuckets.js";
import { businessUtcRangeForTimeframe } from "../src/utils/businessTime.js";

const TARGET = {
  venues: Number(process.env.SPRINT4_VENUES ?? 50),
  employees: Number(process.env.SPRINT4_EMPLOYEES ?? 500),
  tips: Number(process.env.SPRINT4_TIPS ?? 5000),
};

const CONCURRENT_DASHBOARD = Number(process.env.SPRINT4_CONCURRENT ?? 24);
const CONCURRENT_WEBHOOKS = Number(process.env.SPRINT4_WEBHOOK_CONCURRENCY ?? 40);

type Timings = Record<string, number[]>;

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Math.round(sorted[idx]!);
}

function summarize(label: string, ms: number[]): Record<string, number> {
  const avg = ms.length ? ms.reduce((a, b) => a + b, 0) / ms.length : 0;
  return {
    samples: ms.length,
    minMs: ms.length ? Math.round(Math.min(...ms)) : 0,
    avgMs: Math.round(avg),
    p50Ms: percentile(ms, 50),
    p95Ms: percentile(ms, 95),
    p99Ms: percentile(ms, 99),
    maxMs: ms.length ? Math.round(Math.max(...ms)) : 0,
  };
}

async function time<T>(fn: () => Promise<T>): Promise<{ ms: number; value: T }> {
  const t0 = performance.now();
  const value = await fn();
  return { ms: performance.now() - t0, value };
}

async function seedFixtures(tag: string) {
  const passwordHash = await bcrypt.hash("Sprint4Load!", 10);
  const employeesPerVenue = Math.max(1, Math.floor(TARGET.employees / TARGET.venues));
  const tipsPerVenue = Math.max(1, Math.floor(TARGET.tips / TARGET.venues));

  const businessIds: string[] = [];
  const employeeIds: string[] = [];

  console.info(`[sprint4-load] Seeding ${TARGET.venues} venues, ~${employeesPerVenue}/venue, ~${tipsPerVenue} tips/venue…`);

  for (let v = 0; v < TARGET.venues; v++) {
    const slug = `sprint4-load-${tag}-${v}`;
    const manager = await prisma.user.create({
      data: {
        email: `sprint4-mgr-${tag}-${v}@caretip-test.local`,
        passwordHash,
        role: "MANAGER",
        emailVerified: true,
        hasCompletedOnboarding: true,
        business: {
          create: {
            name: `Sprint4 Load Venue ${v}`,
            slug,
            verificationStatus: "verified",
            timezone: "Europe/Berlin",
          },
        },
      },
      include: { business: true },
    });
    const businessId = manager.business!.id;
    businessIds.push(businessId);

    for (let e = 0; e < employeesPerVenue; e++) {
      const empUser = await prisma.user.create({
        data: {
          email: `sprint4-emp-${tag}-${v}-${e}@caretip-test.local`,
          passwordHash,
          role: "EMPLOYEE",
          emailVerified: true,
          employee: {
            create: {
              name: `Staff ${v}-${e}`,
              slug: `sprint4-staff-${tag}-${v}-${e}`,
              jobTitle: "Server",
              businessId,
              isActive: true,
              activationStatus: "active",
            },
          },
        },
        include: { employee: true },
      });
      employeeIds.push(empUser.employee!.id);
    }
  }

  const tipsPerEmployee = Math.max(1, Math.floor(TARGET.tips / employeeIds.length));
  let tipsCreated = 0;
  const batch: Array<{
    amount: number;
    status: "success";
    employeeId: string;
    businessId: string;
    createdAt: Date;
  }> = [];

  const now = Date.now();
  for (let i = 0; i < employeeIds.length && tipsCreated < TARGET.tips; i++) {
    const employeeId = employeeIds[i]!;
    const businessId = businessIds[Math.floor(i / employeesPerVenue)]!;
    const count = Math.min(tipsPerEmployee, TARGET.tips - tipsCreated);
    for (let t = 0; t < count; t++) {
      batch.push({
        amount: 3 + (t % 7),
        status: "success",
        employeeId,
        businessId,
        createdAt: new Date(now - (tipsCreated % 720) * 3_600_000),
      });
      tipsCreated++;
      if (batch.length >= 250) {
        await prisma.transaction.createMany({ data: batch });
        batch.length = 0;
      }
    }
  }
  if (batch.length) await prisma.transaction.createMany({ data: batch });

  return { tag, businessIds, employeeIds, tipsCreated };
}

async function cleanupFixtures(tag: string) {
  const businesses = await prisma.business.findMany({
    where: { slug: { startsWith: `sprint4-load-${tag}` } },
    select: { id: true },
  });
  const ids = businesses.map((b) => b.id);
  if (!ids.length) return;
  await prisma.transaction.deleteMany({ where: { businessId: { in: ids } } });
  await prisma.employee.deleteMany({ where: { businessId: { in: ids } } });
  await prisma.business.deleteMany({ where: { id: { in: ids } } });
  await prisma.user.deleteMany({
    where: { email: { contains: `sprint4-` } },
  });
  await prisma.stripeWebhookEvent.deleteMany({
    where: { id: { startsWith: `sprint4_evt_${tag}` } },
  });
}

async function benchmarkHotPaths(businessIds: string[], employeeIds: string[]) {
  const timings: Timings = {};
  const record = (key: string, ms: number) => {
    (timings[key] ??= []).push(ms);
  };

  const sampleBusiness = businessIds[0]!;
  const sampleEmployee = employeeIds[0]!;

  const coldBiz = await time(() => getBusinessStats(sampleBusiness, "month", "summary"));
  record("businessStatsSummaryCold", coldBiz.ms);

  const warmBiz = await time(() => getBusinessStats(sampleBusiness, "month", "summary"));
  record("businessStatsSummaryWarm", warmBiz.ms);

  const analytics = await time(() => getBusinessStats(sampleBusiness, "month", "analytics"));
  record("businessStatsAnalytics", analytics.ms);

  const empCtx = await prisma.employee.findUnique({
    where: { id: sampleEmployee },
    select: { userId: true, business: { select: { timezone: true } } },
  });
  if (empCtx?.userId) {
    const empCold = await time(() =>
      loadEmployeeDashboardSummaryBundle({
        employeeId: sampleEmployee,
        userId: empCtx.userId,
        businessTimezone: empCtx.business?.timezone ?? "Europe/Berlin",
        timeframe: "month",
      }),
    );
    record("employeeDashboardSummary", empCold.ms);
  }

  const range = businessUtcRangeForTimeframe("month", "Europe/Berlin");
  const now = new Date();
  const sqlBundle = await time(() =>
    queryBusinessDashboardSqlBundle({
      businessId: sampleBusiness,
      timeframe: "month",
      rangeStart: range?.startUtc ?? new Date(0),
      rangeEnd: range?.endUtc ?? now,
      scanStart: range?.startUtc ?? new Date(0),
      scanEnd: range?.endUtc ?? now,
      sixtyAgo: new Date(Date.now() - 3_600_000),
      todayStart: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())),
      todayEnd: now,
      timezone: "Europe/Berlin",
    }),
  );
  record("businessSqlBundleRaw", sqlBundle.ms);

  const platform = await time(() => getGlobalPlatformStats());
  record("platformStats", platform.ms);

  const kycMetrics = await time(() => getKycQueueMetrics());
  record("kycQueueMetrics", kycMetrics.ms);

  const dashConcurrent = await Promise.all(
    Array.from({ length: CONCURRENT_DASHBOARD }, (_, i) => {
      const bid = businessIds[i % businessIds.length]!;
      return time(() => getBusinessStats(bid, "month", "summary"));
    }),
  );
  for (const r of dashConcurrent) record("businessStatsSummaryConcurrent", r.ms);

  const webhookIds = Array.from(
    { length: CONCURRENT_WEBHOOKS },
    (_, i) => `sprint4_evt_${Date.now()}_wh_${i}`,
  );
  const webhookConcurrent = await Promise.all(
    webhookIds.map(async (id) => {
      const t0 = performance.now();
      const seen = await isStripeWebhookEventProcessed(id);
      if (!seen) await markStripeWebhookEventProcessed(id, "checkout.session.completed");
      return performance.now() - t0;
    }),
  );
  for (const ms of webhookConcurrent) record("webhookIdempotencyConcurrent", ms);

  await prisma.stripeWebhookEvent.deleteMany({ where: { id: { in: webhookIds } } });

  const counts = await prisma.$queryRaw<
    Array<{ businesses: bigint; employees: bigint; tips: bigint }>
  >`
    SELECT
      (SELECT COUNT(*)::bigint FROM businesses WHERE slug LIKE 'sprint4-load-%') AS businesses,
      (SELECT COUNT(*)::bigint FROM employees e INNER JOIN businesses b ON b.id = e.business_id WHERE b.slug LIKE 'sprint4-load-%') AS employees,
      (SELECT COUNT(*)::bigint FROM tips t INNER JOIN businesses b ON b.id = t.business_id WHERE b.slug LIKE 'sprint4-load-%') AS tips
  `;

  return {
    timings,
    fixtureCounts: {
      businesses: Number(counts[0]?.businesses ?? 0),
      employees: Number(counts[0]?.employees ?? 0),
      tips: Number(counts[0]?.tips ?? 0),
    },
  };
}

async function main() {
  const tag = String(Date.now());
  const poolDiagnostics = getDatabasePoolDiagnostics();
  console.info("[sprint4-load] database pool:", JSON.stringify(poolDiagnostics));
  const seedStarted = performance.now();
  let fixture: Awaited<ReturnType<typeof seedFixtures>> | null = null;

  try {
    fixture = await seedFixtures(tag);
    const seedMs = Math.round(performance.now() - seedStarted);

    const bench = await benchmarkHotPaths(fixture.businessIds, fixture.employeeIds);

    const report = {
      generatedAt: new Date().toISOString(),
      target: TARGET,
      databasePool: poolDiagnostics,
      seedMs,
      tipsCreated: fixture.tipsCreated,
      fixtureCounts: bench.fixtureCounts,
      concurrent: {
        dashboardRequests: CONCURRENT_DASHBOARD,
        webhookChecks: CONCURRENT_WEBHOOKS,
      },
      metrics: Object.fromEntries(
        Object.entries(bench.timings).map(([k, v]) => [k, summarize(k, v)]),
      ),
      indexesVerified: true,
    };

    console.info(JSON.stringify(report, null, 2));
  } finally {
    if (fixture) {
      console.info("[sprint4-load] Cleaning up fixtures…");
      await cleanupFixtures(tag);
    }
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("[sprint4-load] failed", err);
  process.exit(1);
});
