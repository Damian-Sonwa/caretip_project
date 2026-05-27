import { EmployeeGoalStatus, type GoalPeriod, Prisma, TipStatus } from "@prisma/client";
import { prisma } from "../prisma.js";
import { getCachedOrLoad, invalidateCacheKeyPrefix } from "../utils/shortLivedCache.js";
import type { TipForEmployee } from "./tips.service.js";
import { businessUtcRangeForTimeframe, sanitizeIanaTimezone } from "../utils/businessTime.js";
import { logDashboardPhase } from "../utils/dashboardTiming.js";
import {
  buildEmployeeChartSeries,
  queryEmployeeAnalyticsBundle,
} from "../utils/tipChartBuckets.js";
import {
  buildActiveGoalWithProgress,
  effectivePeriodBounds,
  getMyGoalWithProgressForEmployee,
  type GoalWithProgress,
} from "./goal.service.js";

export type EmployeeDashboardTimeframe = "today" | "week" | "month";

/**
 * Charts + aggregates for `/api/tips/employee` period views.
 * All boundaries use business-local calendar (IANA timezone on Business).
 */

const EMPLOYEE_PERIOD_CACHE_TTL_MS = 30_000;
const EMPLOYEE_TIPS_CTX_TTL_MS = 60_000;

export type EmployeeActiveGoalContext = {
  id: string;
  employeeId: string;
  name: string;
  goalAmount: number;
  goalPeriod: GoalPeriod;
  startDate: Date;
  status: EmployeeGoalStatus;
};

export type EmployeeTipsContext = {
  id: string;
  monthlyGoal: number | null;
  businessTimezone: string;
  activeGoal: EmployeeActiveGoalContext | null;
};

function mapActiveGoal(
  employeeId: string,
  g:
    | {
        id: string;
        name: string;
        goalAmount: unknown;
        goalPeriod: GoalPeriod;
        startDate: Date;
        status: EmployeeGoalStatus;
      }
    | undefined,
): EmployeeActiveGoalContext | null {
  if (!g) return null;
  return {
    id: g.id,
    employeeId,
    name: g.name,
    goalAmount: Number(g.goalAmount),
    goalPeriod: g.goalPeriod,
    startDate: g.startDate,
    status: g.status,
  };
}

/** Cached employee, timezone, and active goal (avoids extra goal lookup per summary). */
export async function getEmployeeTipsContext(userId: string): Promise<EmployeeTipsContext | null> {
  return getCachedOrLoad(`emp-tips-ctx:${userId}`, EMPLOYEE_TIPS_CTX_TTL_MS, async () => {
    const goalSelect = {
      where: { status: EmployeeGoalStatus.active },
      orderBy: [{ updatedAt: "desc" as const }],
      take: 1,
      select: {
        id: true,
        name: true,
        goalAmount: true,
        goalPeriod: true,
        startDate: true,
        status: true,
      },
    };
    try {
      const row = await prisma.employee.findUnique({
        where: { userId },
        select: {
          id: true,
          monthlyGoal: true,
          business: { select: { timezone: true } },
          employeeGoals: goalSelect,
        },
      });
      if (!row) return null;
      return {
        id: row.id,
        monthlyGoal: row.monthlyGoal != null ? Number(row.monthlyGoal) : null,
        businessTimezone: sanitizeIanaTimezone(row.business?.timezone),
        activeGoal: mapActiveGoal(row.id, row.employeeGoals[0]),
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2022") {
        const row = await prisma.employee.findUnique({
          where: { userId },
          select: { id: true, business: { select: { timezone: true } } },
        });
        if (!row) return null;
        return {
          id: row.id,
          monthlyGoal: null,
          businessTimezone: sanitizeIanaTimezone(row.business?.timezone),
          activeGoal: null,
        };
      }
      throw e;
    }
  });
}

export function invalidateEmployeeTipsContext(userId: string): void {
  invalidateCacheKeyPrefix(`emp-tips-ctx:${userId}`);
}

export function invalidateEmployeeDashboardCache(employeeId: string): void {
  invalidateCacheKeyPrefix(`emp-period-summary:${employeeId}:`);
  invalidateCacheKeyPrefix(`emp-dash-summary:${employeeId}:`);
  invalidateCacheKeyPrefix(`emp-dash-summary-bundle:${employeeId}:`);
  invalidateCacheKeyPrefix(`emp-period-analytics:${employeeId}:`);
  invalidateCacheKeyPrefix(`emp-month-total:${employeeId}:`);
  invalidateCacheKeyPrefix(`emp-account:${employeeId}`);
}

/** Period metrics + current-month total in a single DB round trip. */
export async function loadEmployeeDashboardSummary(opts: {
  employeeId: string;
  businessTimezone: string;
  timeframe: EmployeeDashboardTimeframe;
}): Promise<{
  periodAmountEur: number;
  periodTipCount: number;
  currentMonthTotal: number;
}> {
  const cacheKey = `emp-dash-summary:${opts.employeeId}:${opts.timeframe}:${opts.businessTimezone}`;
  return getCachedOrLoad(cacheKey, EMPLOYEE_PERIOD_CACHE_TTL_MS, async () => {
    const label = `employee.summary.${opts.timeframe}`;
    return logDashboardPhase(label, "sql", async () => {
      const tz = sanitizeIanaTimezone(opts.businessTimezone);
      const periodRange = businessUtcRangeForTimeframe(opts.timeframe, tz);
      const monthRange = businessUtcRangeForTimeframe("month", tz);
      if (!periodRange || !monthRange) {
        return { periodAmountEur: 0, periodTipCount: 0, currentMonthTotal: 0 };
      }

      const scanStart =
        periodRange.startUtc.getTime() < monthRange.startUtc.getTime()
          ? periodRange.startUtc
          : monthRange.startUtc;
      const scanEnd =
        periodRange.endUtc.getTime() > monthRange.endUtc.getTime()
          ? periodRange.endUtc
          : monthRange.endUtc;

      const rows = await prisma.$queryRaw<
        Array<{
          period_amount: number;
          period_count: number;
          month_amount: number;
        }>
      >(Prisma.sql`
        SELECT
          COALESCE(SUM(amount) FILTER (
            WHERE created_at >= ${periodRange.startUtc} AND created_at <= ${periodRange.endUtc}
          ), 0)::float AS period_amount,
          (COUNT(*) FILTER (
            WHERE created_at >= ${periodRange.startUtc} AND created_at <= ${periodRange.endUtc}
          ))::int AS period_count,
          COALESCE(SUM(amount) FILTER (
            WHERE created_at >= ${monthRange.startUtc} AND created_at <= ${monthRange.endUtc}
          ), 0)::float AS month_amount
        FROM tips
        WHERE employee_id = ${opts.employeeId}
          AND status = 'success'
          AND created_at >= ${scanStart}
          AND created_at <= ${scanEnd}
      `);

      const row = rows[0];
      return {
        periodAmountEur: Number(row?.period_amount ?? 0),
        periodTipCount: Number(row?.period_count ?? 0),
        currentMonthTotal: Number(row?.month_amount ?? 0),
      };
    });
  });
}

/** Summary metrics + goal (narrow scans for today/week; month uses one monthly scan). */
export async function loadEmployeeDashboardSummaryBundle(opts: {
  employeeId: string;
  userId: string;
  businessTimezone: string;
  timeframe: EmployeeDashboardTimeframe;
  activeGoal?: EmployeeActiveGoalContext | null;
}): Promise<{
  periodAmountEur: number;
  periodTipCount: number;
  currentMonthTotal: number;
  goal: GoalWithProgress | null;
}> {
  const cacheKey = `emp-dash-summary-bundle:${opts.employeeId}:${opts.timeframe}:${opts.businessTimezone}`;
  return getCachedOrLoad(cacheKey, EMPLOYEE_PERIOD_CACHE_TTL_MS, async () => {
    const label = `employee.summary.${opts.timeframe}`;
    const tz = sanitizeIanaTimezone(opts.businessTimezone);
    const periodRange = businessUtcRangeForTimeframe(opts.timeframe, tz);
    const monthRange = businessUtcRangeForTimeframe("month", tz);
    if (!periodRange || !monthRange) {
      return {
        periodAmountEur: 0,
        periodTipCount: 0,
        currentMonthTotal: 0,
        goal: null,
      };
    }

    const now = new Date();
    const activeGoal = opts.activeGoal ?? null;
    const goalBounds = activeGoal
      ? effectivePeriodBounds(activeGoal.goalPeriod, activeGoal.startDate, now)
      : null;

    if (opts.timeframe === "month") {
      const row = await logDashboardPhase(label, "sqlMonth", () =>
        goalBounds
          ? prisma.$queryRaw<
              Array<{
                period_amount: number;
                period_count: number;
                goal_amount: number;
              }>
            >(Prisma.sql`
              SELECT
                COALESCE(SUM(amount), 0)::float AS period_amount,
                COUNT(*)::int AS period_count,
                COALESCE(SUM(amount) FILTER (
                  WHERE created_at >= ${goalBounds.start} AND created_at <= ${goalBounds.end}
                ), 0)::float AS goal_amount
              FROM tips
              WHERE employee_id = ${opts.employeeId}
                AND status = 'success'
                AND created_at >= ${monthRange.startUtc}
                AND created_at <= ${monthRange.endUtc}
            `)
          : prisma.$queryRaw<
              Array<{ period_amount: number; period_count: number }>
            >(Prisma.sql`
              SELECT
                COALESCE(SUM(amount), 0)::float AS period_amount,
                COUNT(*)::int AS period_count
              FROM tips
              WHERE employee_id = ${opts.employeeId}
                AND status = 'success'
                AND created_at >= ${monthRange.startUtc}
                AND created_at <= ${monthRange.endUtc}
            `),
      );
      const hit = row[0];
      const periodAmountEur = Number(hit?.period_amount ?? 0);
      const goal =
        activeGoal && goalBounds
          ? buildActiveGoalWithProgress(
              activeGoal,
              Number((hit as { goal_amount?: number }).goal_amount ?? 0),
              now,
            )
          : null;
      return {
        periodAmountEur,
        periodTipCount: Number(hit?.period_count ?? 0),
        currentMonthTotal: periodAmountEur,
        goal,
      };
    }

    const goalFitsPeriod =
      goalBounds != null &&
      goalBounds.start.getTime() >= periodRange.startUtc.getTime() &&
      goalBounds.end.getTime() <= periodRange.endUtc.getTime();

    const scanStart =
      monthRange.startUtc.getTime() < periodRange.startUtc.getTime()
        ? monthRange.startUtc
        : periodRange.startUtc;
    const scanEnd =
      monthRange.endUtc.getTime() > periodRange.endUtc.getTime()
        ? monthRange.endUtc
        : periodRange.endUtc;

    const periodRows = await logDashboardPhase(label, "sqlPeriodMonth", () =>
      goalBounds && goalFitsPeriod
        ? prisma.$queryRaw<
            Array<{
              period_amount: number;
              period_count: number;
              month_amount: number;
              goal_amount: number;
            }>
          >(Prisma.sql`
            SELECT
              COALESCE(SUM(amount) FILTER (
                WHERE created_at >= ${periodRange.startUtc} AND created_at <= ${periodRange.endUtc}
              ), 0)::float AS period_amount,
              (COUNT(*) FILTER (
                WHERE created_at >= ${periodRange.startUtc} AND created_at <= ${periodRange.endUtc}
              ))::int AS period_count,
              COALESCE(SUM(amount) FILTER (
                WHERE created_at >= ${monthRange.startUtc} AND created_at <= ${monthRange.endUtc}
              ), 0)::float AS month_amount,
              COALESCE(SUM(amount) FILTER (
                WHERE created_at >= ${goalBounds.start} AND created_at <= ${goalBounds.end}
              ), 0)::float AS goal_amount
            FROM tips
            WHERE employee_id = ${opts.employeeId}
              AND status = 'success'
              AND created_at >= ${scanStart}
              AND created_at <= ${scanEnd}
          `)
        : prisma.$queryRaw<
            Array<{
              period_amount: number;
              period_count: number;
              month_amount: number;
            }>
          >(Prisma.sql`
            SELECT
              COALESCE(SUM(amount) FILTER (
                WHERE created_at >= ${periodRange.startUtc} AND created_at <= ${periodRange.endUtc}
              ), 0)::float AS period_amount,
              (COUNT(*) FILTER (
                WHERE created_at >= ${periodRange.startUtc} AND created_at <= ${periodRange.endUtc}
              ))::int AS period_count,
              COALESCE(SUM(amount) FILTER (
                WHERE created_at >= ${monthRange.startUtc} AND created_at <= ${monthRange.endUtc}
              ), 0)::float AS month_amount
            FROM tips
            WHERE employee_id = ${opts.employeeId}
              AND status = 'success'
              AND created_at >= ${scanStart}
              AND created_at <= ${scanEnd}
          `),
    );

    const periodHit = periodRows[0];
    const currentMonthTotal = Number(periodHit?.month_amount ?? 0);

    let goal: GoalWithProgress | null = null;
    if (activeGoal && goalBounds) {
      if (goalFitsPeriod) {
        goal = buildActiveGoalWithProgress(
          activeGoal,
          Number((periodHit as { goal_amount?: number }).goal_amount ?? 0),
          now,
        );
      } else {
        goal = await logDashboardPhase(label, "goalProgress", () =>
          getMyGoalWithProgressForEmployee(opts.employeeId, opts.userId).catch(() => null),
        );
      }
    }

    return {
      periodAmountEur: Number(periodHit?.period_amount ?? 0),
      periodTipCount: Number(periodHit?.period_count ?? 0),
      currentMonthTotal,
      goal,
    };
  });
}

function periodWhere(
  employeeId: string,
  tf: EmployeeDashboardTimeframe | null,
  tz: string,
): Prisma.TransactionWhereInput {
  const whereBase: Prisma.TransactionWhereInput = {
    employeeId,
    status: TipStatus.success,
  };
  if (tf != null) {
    const r = businessUtcRangeForTimeframe(tf, tz);
    if (r) {
      whereBase.createdAt = { gte: r.startUtc, lte: r.endUtc };
    }
  }
  return whereBase;
}

/** Fast period totals for metric cards — no tip rows or chart buckets. */
export async function loadEmployeePeriodSummary(opts: {
  employeeId: string;
  businessTimezone: string;
  timeframe: EmployeeDashboardTimeframe;
}): Promise<{ periodAmountEur: number; periodTipCount: number }> {
  const cacheKey = `emp-period-summary:${opts.employeeId}:${opts.timeframe}:${opts.businessTimezone}`;
  return getCachedOrLoad(cacheKey, EMPLOYEE_PERIOD_CACHE_TTL_MS, async () => {
    const tz = sanitizeIanaTimezone(opts.businessTimezone);
    const whereBase = periodWhere(opts.employeeId, opts.timeframe, tz);
    const aggregates = await prisma.transaction.aggregate({
      where: whereBase,
      _sum: { amount: true },
      _count: { _all: true },
    });
    return {
      periodAmountEur: Number(aggregates._sum.amount ?? 0),
      periodTipCount: aggregates._count._all,
    };
  });
}

/** Charts + recent tips for period analytics sections. */
export async function loadEmployeePeriodAnalytics(opts: {
  employeeId: string;
  businessTimezone: string;
  timeframe: EmployeeDashboardTimeframe;
}): Promise<{
  tips: TipForEmployee[];
  chartSeries: Array<{ label: string; amount: number }>;
}> {
  const cacheKey = `emp-period-analytics:${opts.employeeId}:${opts.timeframe}:${opts.businessTimezone}`;
  return getCachedOrLoad(cacheKey, EMPLOYEE_PERIOD_CACHE_TTL_MS, async () => {
    const label = `employee.analytics.${opts.timeframe}`;
    const tz = sanitizeIanaTimezone(opts.businessTimezone);
    const range = businessUtcRangeForTimeframe(opts.timeframe, tz);
    const RECENT_TIPS_TAKE = 30;

    if (!range) {
      return { tips: [], chartSeries: [] };
    }

    const bundle = await logDashboardPhase(label, "sqlBundle", () =>
      queryEmployeeAnalyticsBundle({
        employeeId: opts.employeeId,
        startUtc: range.startUtc,
        endUtc: range.endUtc,
        timezone: tz,
        timeframe: opts.timeframe,
        recentTake: RECENT_TIPS_TAKE,
      }),
    );
    const rowsList = bundle.recentTips;
    const buckets = {
      dailyByYmd: bundle.dailyByYmd,
      hourlyByHour: bundle.hourlyByHour,
    };

    const tips: TipForEmployee[] = rowsList.map((t) => ({
      id: t.id,
      amount: t.amount,
      status: t.status as TipForEmployee["status"],
      createdAt: t.createdAt.toISOString(),
    }));

    const chartSeries = buildEmployeeChartSeries(
      opts.timeframe,
      tz,
      buckets.dailyByYmd,
      buckets.hourlyByHour,
    );

    return { tips, chartSeries };
  });
}

export async function loadEmployeeTipsDashboardForTimeframe(opts: {
  employeeId: string;
  businessTimezone: string;
  timeframe: EmployeeDashboardTimeframe | null;
}): Promise<{
  tips: TipForEmployee[];
  periodAmountEur: number;
  periodTipCount: number;
  chartSeries: Array<{ label: string; amount: number }>;
}> {
  const tf = opts.timeframe ?? null;
  if (tf == null) {
    return { tips: [], periodAmountEur: 0, periodTipCount: 0, chartSeries: [] };
  }

  const [summary, analytics] = await Promise.all([
    loadEmployeePeriodSummary({
      employeeId: opts.employeeId,
      businessTimezone: opts.businessTimezone,
      timeframe: tf,
    }),
    loadEmployeePeriodAnalytics({
      employeeId: opts.employeeId,
      businessTimezone: opts.businessTimezone,
      timeframe: tf,
    }),
  ]);

  return {
    tips: analytics.tips,
    periodAmountEur: summary.periodAmountEur,
    periodTipCount: summary.periodTipCount,
    chartSeries: analytics.chartSeries,
  };
}

const EMPLOYEE_ACCOUNT_SUMMARY_TTL_MS = 30_000;

export async function loadEmployeeCurrentMonthTotal(
  employeeId: string,
  businessTimezone: string,
): Promise<number> {
  const cacheKey = `emp-month-total:${employeeId}:${businessTimezone}`;
  return getCachedOrLoad(cacheKey, EMPLOYEE_PERIOD_CACHE_TTL_MS, async () => {
    const monthRange = businessUtcRangeForTimeframe("month", businessTimezone);
    if (!monthRange) return 0;
    const agg = await prisma.transaction.aggregate({
      where: {
        employeeId,
        status: TipStatus.success,
        createdAt: { gte: monthRange.startUtc, lte: monthRange.endUtc },
      },
      _sum: { amount: true },
    });
    return Number(agg._sum.amount ?? 0);
  });
}

/** Lifetime account summary for employee dashboard hero (not period-scoped). */
export async function loadEmployeeAccountSummary(employeeId: string): Promise<{
  totalEarningsEur: number;
  availableBalanceEur: number;
  totalSupporters: number;
}> {
  return getCachedOrLoad(`emp-account:${employeeId}`, EMPLOYEE_ACCOUNT_SUMMARY_TTL_MS, async () => {
    const rows = await logDashboardPhase("employee.account", "sql", () =>
      prisma.$queryRaw<
        Array<{
          total_earnings: number;
          paid_total: number;
          tip_count: number;
        }>
      >(Prisma.sql`
        SELECT
          COALESCE(SUM(amount), 0)::float AS total_earnings,
          COALESCE(SUM(amount) FILTER (WHERE payout_status = 'paid'), 0)::float AS paid_total,
          COUNT(*)::int AS tip_count
        FROM tips
        WHERE employee_id = ${employeeId}
          AND status = 'success'
      `),
    );
    const row = rows[0];
    return {
      totalEarningsEur: Number(row?.total_earnings ?? 0),
      availableBalanceEur: Number(row?.paid_total ?? 0),
      /** Each successful tip counts as one supporter interaction (guests are anonymous). */
      totalSupporters: Number(row?.tip_count ?? 0),
    };
  });
}
