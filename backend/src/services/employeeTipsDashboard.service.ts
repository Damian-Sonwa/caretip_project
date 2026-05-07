import type { Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import { prisma } from "../prisma.js";
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

export async function loadEmployeeTipsDashboardForTimeframe(opts: {
  employeeId: string;
  businessTimezone: string;
  timeframe: EmployeeDashboardTimeframe | null;
}): Promise<{
  tips: TipForEmployee[];
  /** Sum of successful tips in selected period — single source with list + chart */
  periodAmountEur: number;
  /** Count of tips in selected period */
  periodTipCount: number;
  chartSeries: Array<{ label: string; amount: number }>;
}> {
  const tz = sanitizeIanaTimezone(opts.businessTimezone);
  const tf = opts.timeframe ?? null;

  const whereBase: Prisma.TransactionWhereInput = {
    employeeId: opts.employeeId,
    status: "success",
  };

  if (tf != null) {
    const r = businessUtcRangeForTimeframe(tf, tz);
    if (r) {
      whereBase.createdAt = {
        gte: r.startUtc,
        lte: r.endUtc,
      };
    }
  }

  const [rowsList, aggregates] = await Promise.all([
    prisma.transaction.findMany({
      where: whereBase,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.transaction.aggregate({
      where: whereBase,
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ]);

  const tips: TipForEmployee[] = rowsList.map((t) => ({
    id: t.id,
    amount: Number(t.amount),
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  }));

  const periodAmountEur = Number(aggregates._sum.amount ?? 0);
  const periodTipCount = aggregates._count._all;

  const chartSeries =
    tf != null
      ? buildChart(
          rowsList.map((r) => ({ createdAt: r.createdAt, amount: Number(r.amount) })),
          tf,
          tz,
        )
      : ([] as Array<{ label: string; amount: number }>);

  return {
    tips,
    periodAmountEur,
    periodTipCount,
    chartSeries,
  };
}
