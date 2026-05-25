import { TipStatus, type Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import { prisma } from "../prisma.js";
import { getCachedOrLoad } from "../utils/shortLivedCache.js";
import { runSerializedByKey } from "../utils/serializedByKey.js";
import type { TipForEmployee } from "./tips.service.js";
import { businessDayKey, businessUtcRangeForTimeframe, sanitizeIanaTimezone } from "../utils/businessTime.js";

export type EmployeeDashboardTimeframe = "today" | "week" | "month";

/**
 * Charts + aggregates for `/api/tips/employee` period views.
 * All boundaries use business-local calendar (IANA timezone on Business).
 */

function mondayOfWeekContaining(localDay: DateTime): DateTime {
  const d = localDay.startOf("day");
  const luxonWd = d.weekday; // Mon 1 … Sun 7
  return d.minus({ days: (luxonWd + 6) % 7 });
}

function buildChart(
  rows: ReadonlyArray<{ createdAt: Date; amount: number }>,
  timeframe: EmployeeDashboardTimeframe,
  businessTimezone: string,
): Array<{ label: string; amount: number }> {
  const tz = sanitizeIanaTimezone(businessTimezone);
  const tips = [...rows]; // chronological not required — we bucket by keys

  if (timeframe === "today") {
    const buckets = Array.from({ length: 24 }, (_, h) => ({
      label: `${h}:00`,
      amount: 0,
    }));
    for (const t of tips) {
      const h = DateTime.fromJSDate(t.createdAt, { zone: "utc" }).setZone(tz).hour;
      if (h >= 0 && h < 24) buckets[h].amount += t.amount;
    }
    return buckets;
  }

  if (timeframe === "week") {
    const nowLocal = DateTime.utc().setZone(tz).startOf("day");
    const mon = mondayOfWeekContaining(nowLocal);
    const order: string[] = [];
    for (let i = 0; i < 7; i += 1) {
      order.push(mon.plus({ days: i }).toFormat("yyyy-LL-dd"));
    }
    const totals = new Map<string, number>(order.map((k) => [k, 0]));

    for (const t of tips) {
      const key = businessDayKey(t.createdAt, tz);
      const cur = totals.get(key);
      if (cur != null) totals.set(key, cur + t.amount);
    }

    return order.map((ymd) => {
      const dl = DateTime.fromISO(ymd, { zone: tz }).startOf("day");
      return {
        label: dl.toFormat("ccc"),
        amount: totals.get(ymd) ?? 0,
      };
    });
  }

  // month — full calendar month, one bucket per calendar day (no compression)
  const nowLocal = DateTime.utc().setZone(tz);
  const monthStart = nowLocal.startOf("month");
  const daysInMonth = nowLocal.daysInMonth ?? 31;
  const totals = new Map<string, number>();

  const orderKeys: string[] = [];
  for (let di = 0; di < daysInMonth; di += 1) {
    const d = monthStart.plus({ days: di });
    const keyStr = d.toFormat("yyyy-LL-dd");
    orderKeys.push(keyStr);
    totals.set(keyStr, 0);
  }

  for (const t of tips) {
    const key = businessDayKey(t.createdAt, tz);
    if (totals.has(key)) {
      totals.set(key, (totals.get(key) ?? 0) + t.amount);
    }
  }

  return orderKeys.map((ymd) => ({
    label: DateTime.fromISO(ymd, { zone: tz }).toFormat("dd"),
    amount: totals.get(ymd) ?? 0,
  }));
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
  const tz = sanitizeIanaTimezone(opts.businessTimezone);
  const whereBase = periodWhere(opts.employeeId, opts.timeframe, tz);
  const rowsList = await prisma.transaction.findMany({
    where: whereBase,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
    },
  });

  const tips: TipForEmployee[] = rowsList.map((t) => ({
    id: t.id,
    amount: Number(t.amount),
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  }));

  const chartSeries = buildChart(
    rowsList.map((r) => ({ createdAt: r.createdAt, amount: Number(r.amount) })),
    opts.timeframe,
    tz,
  );

  return { tips, chartSeries };
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

  const summary = await loadEmployeePeriodSummary({
    employeeId: opts.employeeId,
    businessTimezone: opts.businessTimezone,
    timeframe: tf,
  });
  const analytics = await loadEmployeePeriodAnalytics({
    employeeId: opts.employeeId,
    businessTimezone: opts.businessTimezone,
    timeframe: tf,
  });

  return {
    tips: analytics.tips,
    periodAmountEur: summary.periodAmountEur,
    periodTipCount: summary.periodTipCount,
    chartSeries: analytics.chartSeries,
  };
}

const EMPLOYEE_ACCOUNT_SUMMARY_TTL_MS = 8_000;

export async function loadEmployeeCurrentMonthTotal(
  employeeId: string,
  businessTimezone: string,
): Promise<number> {
  const monthRange = businessUtcRangeForTimeframe("month", businessTimezone);
  if (!monthRange) return 0;
  return runSerializedByKey("prisma", async () => {
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
  return getCachedOrLoad(`emp-account:${employeeId}`, EMPLOYEE_ACCOUNT_SUMMARY_TTL_MS, () =>
    runSerializedByKey("prisma", async () => {
      const base = { employeeId, status: TipStatus.success };
      const totalAgg = await prisma.transaction.aggregate({
        where: base,
        _sum: { amount: true },
      });
      const paidAgg = await prisma.transaction.aggregate({
        where: { ...base, payoutStatus: "paid" },
        _sum: { amount: true },
      });
      const supporterCount = await prisma.transaction.count({ where: base });

      return {
        totalEarningsEur: Number(totalAgg._sum.amount ?? 0),
        availableBalanceEur: Number(paidAgg._sum.amount ?? 0),
        /** Each successful tip counts as one supporter interaction (guests are anonymous). */
        totalSupporters: supporterCount,
      };
    }),
  );
}
