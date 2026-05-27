import { Prisma } from "@prisma/client";
import { DateTime } from "luxon";
import { prisma } from "../prisma.js";
import { businessDayKey, sanitizeIanaTimezone } from "./businessTime.js";

function mondayOfWeekContaining(localDay: DateTime): DateTime {
  const d = localDay.startOf("day");
  const luxonWd = d.weekday;
  return d.minus({ days: (luxonWd + 6) % 7 });
}

/** Daily tip totals keyed by business-local YYYY-MM-DD (SQL aggregation). */
export async function queryDailyTipBuckets(opts: {
  employeeId?: string;
  businessId?: string;
  startUtc: Date;
  endUtc: Date;
  timezone: string;
}): Promise<Map<string, number>> {
  const tz = sanitizeIanaTimezone(opts.timezone);
  const employeeFilter =
    opts.employeeId != null
      ? Prisma.sql`AND employee_id = ${opts.employeeId}`
      : Prisma.empty;
  const businessFilter =
    opts.businessId != null
      ? Prisma.sql`AND business_id = ${opts.businessId}`
      : Prisma.empty;

  const rows = await prisma.$queryRaw<Array<{ d: string; total: number }>>(Prisma.sql`
    SELECT
      to_char(date_trunc('day', created_at AT TIME ZONE ${tz}), 'YYYY-MM-DD') AS d,
      COALESCE(SUM(amount), 0)::float AS total
    FROM tips
    WHERE status = 'success'
      AND created_at >= ${opts.startUtc}
      AND created_at <= ${opts.endUtc}
      ${employeeFilter}
      ${businessFilter}
    GROUP BY 1
    ORDER BY 1 ASC
  `);

  const m = new Map<string, number>();
  for (const r of rows) {
    m.set(String(r.d).slice(0, 10), Number(r.total ?? 0));
  }
  return m;
}

/** Recent tips for employee period (index-friendly ORDER BY created_at DESC LIMIT n). */
export async function queryRecentEmployeeTips(opts: {
  employeeId: string;
  startUtc: Date;
  endUtc: Date;
  take: number;
}): Promise<
  Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: Date;
  }>
> {
  const take = Math.max(1, Math.min(50, opts.take));
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      amount: number;
      status: string;
      created_at: Date;
    }>
  >(Prisma.sql`
    SELECT id, amount, status::text AS status, created_at
    FROM tips
    WHERE employee_id = ${opts.employeeId}
      AND status = 'success'
      AND created_at >= ${opts.startUtc}
      AND created_at <= ${opts.endUtc}
    ORDER BY created_at DESC
    LIMIT ${take}
  `);
  return rows.map((r) => ({
    id: r.id,
    amount: Number(r.amount),
    status: r.status,
    createdAt: r.created_at,
  }));
}

type RecentTipJsonRow = {
  id: string;
  amount: number;
  status: string;
  created_at: string | Date;
};

type BucketJsonRow = { h?: number; d?: string; total: number };

function parseRecentTipsJson(raw: unknown): Array<{
  id: string;
  amount: number;
  status: string;
  createdAt: Date;
}> {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const t = row as RecentTipJsonRow;
    return {
      id: String(t.id),
      amount: Number(t.amount ?? 0),
      status: String(t.status ?? "success"),
      createdAt: t.created_at instanceof Date ? t.created_at : new Date(t.created_at),
    };
  });
}

function parseHourlyBucketsJson(raw: unknown): Map<number, number> {
  const m = new Map<number, number>();
  if (!Array.isArray(raw)) return m;
  for (const row of raw as BucketJsonRow[]) {
    const h = Number(row.h);
    if (h >= 0 && h < 24) m.set(h, Number(row.total ?? 0));
  }
  return m;
}

function parseDailyBucketsJson(raw: unknown): Map<string, number> {
  const m = new Map<string, number>();
  if (!Array.isArray(raw)) return m;
  for (const row of raw as BucketJsonRow[]) {
    const d = String(row.d ?? "").slice(0, 10);
    if (d) m.set(d, Number(row.total ?? 0));
  }
  return m;
}

/**
 * Recent tips + chart buckets in one round trip (required when Prisma connection_limit=1).
 */
export async function queryEmployeeAnalyticsBundle(opts: {
  employeeId: string;
  startUtc: Date;
  endUtc: Date;
  timezone: string;
  timeframe: "today" | "week" | "month";
  recentTake: number;
}): Promise<{
  recentTips: Array<{ id: string; amount: number; status: string; createdAt: Date }>;
  dailyByYmd: Map<string, number>;
  hourlyByHour: Map<number, number>;
}> {
  const tz = sanitizeIanaTimezone(opts.timezone);
  const take = Math.max(1, Math.min(50, opts.recentTake));

  if (opts.timeframe === "today") {
    const rows = await prisma.$queryRaw<
      Array<{ recent_json: unknown; buckets_json: unknown }>
    >(Prisma.sql`
      SELECT
        (
          SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json)
          FROM (
            SELECT id, amount, status::text AS status, created_at
            FROM tips
            WHERE employee_id = ${opts.employeeId}
              AND status = 'success'
              AND created_at >= ${opts.startUtc}
              AND created_at <= ${opts.endUtc}
            ORDER BY created_at DESC
            LIMIT ${take}
          ) r
        ) AS recent_json,
        (
          SELECT COALESCE(json_agg(row_to_json(b)), '[]'::json)
          FROM (
            SELECT
              EXTRACT(HOUR FROM (created_at AT TIME ZONE ${tz}))::int AS h,
              COALESCE(SUM(amount), 0)::float AS total
            FROM tips
            WHERE employee_id = ${opts.employeeId}
              AND status = 'success'
              AND created_at >= ${opts.startUtc}
              AND created_at <= ${opts.endUtc}
            GROUP BY 1
          ) b
        ) AS buckets_json
    `);
    const row = rows[0];
    return {
      recentTips: parseRecentTipsJson(row?.recent_json),
      dailyByYmd: new Map(),
      hourlyByHour: parseHourlyBucketsJson(row?.buckets_json),
    };
  }

  const rows = await prisma.$queryRaw<
    Array<{ recent_json: unknown; buckets_json: unknown }>
  >(Prisma.sql`
    SELECT
      (
        SELECT COALESCE(json_agg(row_to_json(r)), '[]'::json)
        FROM (
          SELECT id, amount, status::text AS status, created_at
          FROM tips
          WHERE employee_id = ${opts.employeeId}
            AND status = 'success'
            AND created_at >= ${opts.startUtc}
            AND created_at <= ${opts.endUtc}
          ORDER BY created_at DESC
          LIMIT ${take}
        ) r
      ) AS recent_json,
      (
        SELECT COALESCE(json_agg(row_to_json(b)), '[]'::json)
        FROM (
          SELECT
            to_char(date_trunc('day', created_at AT TIME ZONE ${tz}), 'YYYY-MM-DD') AS d,
            COALESCE(SUM(amount), 0)::float AS total
          FROM tips
          WHERE employee_id = ${opts.employeeId}
            AND status = 'success'
            AND created_at >= ${opts.startUtc}
            AND created_at <= ${opts.endUtc}
          GROUP BY 1
        ) b
      ) AS buckets_json
  `);
  const row = rows[0];
  return {
    recentTips: parseRecentTipsJson(row?.recent_json),
    dailyByYmd: parseDailyBucketsJson(row?.buckets_json),
    hourlyByHour: new Map(),
  };
}

/** Hourly tip totals for business-local day (0–23). */
export async function queryHourlyTipBuckets(opts: {
  employeeId?: string;
  businessId?: string;
  startUtc: Date;
  endUtc: Date;
  timezone: string;
}): Promise<Map<number, number>> {
  const tz = sanitizeIanaTimezone(opts.timezone);
  const employeeFilter =
    opts.employeeId != null
      ? Prisma.sql`AND employee_id = ${opts.employeeId}`
      : Prisma.empty;
  const businessFilter =
    opts.businessId != null
      ? Prisma.sql`AND business_id = ${opts.businessId}`
      : Prisma.empty;

  const rows = await prisma.$queryRaw<Array<{ h: number; total: number }>>(Prisma.sql`
    SELECT
      EXTRACT(HOUR FROM (created_at AT TIME ZONE ${tz}))::int AS h,
      COALESCE(SUM(amount), 0)::float AS total
    FROM tips
    WHERE status = 'success'
      AND created_at >= ${opts.startUtc}
      AND created_at <= ${opts.endUtc}
      ${employeeFilter}
      ${businessFilter}
    GROUP BY 1
    ORDER BY 1 ASC
  `);

  const m = new Map<number, number>();
  for (const r of rows) {
    const h = Number(r.h);
    if (h >= 0 && h < 24) m.set(h, Number(r.total ?? 0));
  }
  return m;
}

/** Monthly tip totals for a year window (index 0 = January). */
export async function queryMonthlyTipTotalsForRange(opts: {
  businessId?: string;
  employeeId?: string;
  startUtc: Date;
  endUtc: Date;
  timezone: string;
}): Promise<number[]> {
  const tz = sanitizeIanaTimezone(opts.timezone);
  const employeeFilter =
    opts.employeeId != null
      ? Prisma.sql`AND employee_id = ${opts.employeeId}`
      : Prisma.empty;
  const businessFilter =
    opts.businessId != null
      ? Prisma.sql`AND business_id = ${opts.businessId}`
      : Prisma.empty;

  const rows = await prisma.$queryRaw<Array<{ m: number; total: number }>>(Prisma.sql`
    SELECT
      EXTRACT(MONTH FROM (created_at AT TIME ZONE ${tz}))::int AS m,
      COALESCE(SUM(amount), 0)::float AS total
    FROM tips
    WHERE status = 'success'
      AND created_at >= ${opts.startUtc}
      AND created_at <= ${opts.endUtc}
      ${employeeFilter}
      ${businessFilter}
    GROUP BY 1
    ORDER BY 1 ASC
  `);

  const monthTotals = new Array(12).fill(0);
  for (const r of rows) {
    const idx = Number(r.m) - 1;
    if (idx >= 0 && idx < 12) monthTotals[idx] = Number(r.total ?? 0);
  }
  return monthTotals;
}

export type BusinessDashboardTimeframe = "week" | "month" | "year" | "all";

function parseJsonArray<T>(raw: unknown): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as T[];
    } catch {
      // ignore
    }
  }
  return [];
}

export type BusinessDashboardSqlSummary = {
  periodAmount: number;
  periodCount: number;
  last60Amount: number;
  last60Count: number;
  todayAmount: number;
  todayCount: number;
};

export type BusinessDashboardSqlBundle = {
  summary: BusinessDashboardSqlSummary;
  tipsByEmployee: Map<string, { total: number; count: number }>;
  dailyByYmd: Map<string, number>;
  monthTotals: number[] | null;
};

/**
 * One tips-table scan (CTE) for summary hero metrics + analytics chart/employee aggregates.
 * Mirrors employee `loadEmployeeDashboardSummaryBundle` / `queryEmployeeAnalyticsBundle`.
 */
export async function queryBusinessDashboardSqlBundle(opts: {
  businessId: string;
  timeframe: BusinessDashboardTimeframe;
  rangeStart: Date;
  rangeEnd: Date;
  scanStart: Date;
  scanEnd: Date;
  sixtyAgo: Date;
  todayStart: Date;
  todayEnd: Date;
  timezone: string;
}): Promise<BusinessDashboardSqlBundle> {
  const shouldLog =
    process.env.NODE_ENV !== "production" || process.env.DASHBOARD_TIMING === "1";
  const t0 = performance.now();
  const tz = sanitizeIanaTimezone(opts.timezone);
  const includeTimeRange = opts.timeframe !== "all";
  const periodFilter = includeTimeRange
    ? Prisma.sql`AND created_at >= ${opts.rangeStart} AND created_at <= ${opts.rangeEnd}`
    : Prisma.empty;

  const includeDaily = opts.timeframe === "week" || opts.timeframe === "month";
  const includeMonth = opts.timeframe === "year";

  type TipsRow = { employeeId: string; total: number; count: number };
  type DailyRow = { d: string; total: number };
  type MonthRow = { m: number; total: number };

  const [row] = await prisma.$queryRaw<
    Array<{
      period_amount: number;
      period_count: number;
      last60_amount: number;
      last60_count: number;
      today_amount: number;
      today_count: number;
      tips_json: unknown;
      daily_json: unknown;
      month_json: unknown;
    }>
  >(Prisma.sql`
    WITH scoped AS MATERIALIZED (
      SELECT employee_id, amount, created_at
      FROM tips
      WHERE business_id = ${opts.businessId}
        AND status = 'success'
        AND created_at >= ${opts.scanStart}
        AND created_at <= ${opts.scanEnd}
    )
    SELECT
      COALESCE(SUM(amount) FILTER (
        WHERE created_at >= ${opts.rangeStart} AND created_at <= ${opts.rangeEnd}
      ), 0)::float AS period_amount,
      COUNT(*) FILTER (
        WHERE created_at >= ${opts.rangeStart} AND created_at <= ${opts.rangeEnd}
      )::int AS period_count,
      COALESCE(SUM(amount) FILTER (WHERE created_at >= ${opts.sixtyAgo}), 0)::float AS last60_amount,
      COUNT(*) FILTER (WHERE created_at >= ${opts.sixtyAgo})::int AS last60_count,
      COALESCE(SUM(amount) FILTER (
        WHERE created_at >= ${opts.todayStart} AND created_at <= ${opts.todayEnd}
      ), 0)::float AS today_amount,
      COUNT(*) FILTER (
        WHERE created_at >= ${opts.todayStart} AND created_at <= ${opts.todayEnd}
      )::int AS today_count,
      (
        SELECT COALESCE(
          json_agg(
            json_build_object(
              'employeeId', employee_id,
              'total', total_amount,
              'count', total_count
            )
          ),
          '[]'::json
        )
        FROM (
          SELECT
            employee_id,
            COALESCE(SUM(amount), 0)::float AS total_amount,
            COUNT(*)::int AS total_count
          FROM scoped
          WHERE true
            ${periodFilter}
          GROUP BY employee_id
          ORDER BY employee_id ASC
        ) t
      ) AS tips_json,
      ${
        includeDaily
          ? Prisma.sql`(
              SELECT COALESCE(
                json_agg(json_build_object('d', d, 'total', total_amount)),
                '[]'::json
              )
              FROM (
                SELECT
                  to_char(date_trunc('day', created_at AT TIME ZONE ${tz}), 'YYYY-MM-DD') AS d,
                  COALESCE(SUM(amount), 0)::float AS total_amount
                FROM scoped
                WHERE true
                  ${periodFilter}
                GROUP BY 1
                ORDER BY 1 ASC
              ) x
            )`
          : Prisma.sql`'[]'::json`
      } AS daily_json,
      ${
        includeMonth
          ? Prisma.sql`(
              SELECT COALESCE(
                json_agg(json_build_object('m', m, 'total', total_amount)),
                '[]'::json
              )
              FROM (
                SELECT
                  EXTRACT(MONTH FROM (created_at AT TIME ZONE ${tz}))::int AS m,
                  COALESCE(SUM(amount), 0)::float AS total_amount
                FROM scoped
                WHERE true
                  ${periodFilter}
                GROUP BY 1
                ORDER BY 1 ASC
              ) y
            )`
          : Prisma.sql`'[]'::json`
      } AS month_json
    FROM scoped
  `);

  const tSql = Math.round(performance.now() - t0);
  if (shouldLog) {
    console.info(
      `[dashboard.timing] business.myStats.${opts.timeframe}.sqlBundle ${tSql}ms`,
      { businessId: opts.businessId },
    );
  }

  const summary: BusinessDashboardSqlSummary = {
    periodAmount: Number(row?.period_amount ?? 0),
    periodCount: Number(row?.period_count ?? 0),
    last60Amount: Number(row?.last60_amount ?? 0),
    last60Count: Number(row?.last60_count ?? 0),
    todayAmount: Number(row?.today_amount ?? 0),
    todayCount: Number(row?.today_count ?? 0),
  };

  const tipsArr = parseJsonArray<TipsRow>(row?.tips_json);
  const tipsByEmployee = new Map<string, { total: number; count: number }>();
  for (const r of tipsArr) {
    tipsByEmployee.set(String(r.employeeId), {
      total: Number(r.total ?? 0),
      count: Number(r.count ?? 0),
    });
  }

  const dailyArr = parseJsonArray<DailyRow>(row?.daily_json);
  const dailyByYmd = new Map<string, number>();
  for (const r of dailyArr) {
    const key = String(r.d).slice(0, 10);
    if (key) dailyByYmd.set(key, Number(r.total ?? 0));
  }

  let monthTotals: number[] | null = null;
  if (includeMonth) {
    monthTotals = new Array(12).fill(0);
    const monthArr = parseJsonArray<MonthRow>(row?.month_json);
    for (const r of monthArr) {
      const idx = Number(r.m) - 1;
      if (idx >= 0 && idx < 12) monthTotals[idx] = Number(r.total ?? 0);
    }
  }

  return { summary, tipsByEmployee, dailyByYmd, monthTotals };
}

/** @deprecated Use queryBusinessDashboardSqlBundle — kept for callers that only need chart slices. */
export async function queryBusinessTipsAndChartBundle(opts: {
  businessId: string;
  timeframe: BusinessDashboardTimeframe;
  startUtc: Date;
  endUtc: Date;
  timezone: string;
}): Promise<{
  tipsByEmployee: Map<string, { total: number; count: number }>;
  dailyByYmd: Map<string, number>;
  monthTotals: number[] | null;
}> {
  const now = new Date();
  const sixtyAgo = new Date(Date.now() - 60 * 60 * 1000);
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const bundle = await queryBusinessDashboardSqlBundle({
    businessId: opts.businessId,
    timeframe: opts.timeframe,
    rangeStart: opts.startUtc,
    rangeEnd: opts.endUtc,
    scanStart: opts.startUtc,
    scanEnd: opts.endUtc,
    sixtyAgo,
    todayStart,
    todayEnd: now,
    timezone: opts.timezone,
  });
  return {
    tipsByEmployee: bundle.tipsByEmployee,
    dailyByYmd: bundle.dailyByYmd,
    monthTotals: bundle.monthTotals,
  };
}

export type EmployeeDashboardTimeframe = "today" | "week" | "month";

export function buildEmployeeChartSeries(
  timeframe: EmployeeDashboardTimeframe,
  businessTimezone: string,
  dailyByYmd: Map<string, number>,
  hourlyByHour: Map<number, number>,
): Array<{ label: string; amount: number }> {
  const tz = sanitizeIanaTimezone(businessTimezone);

  if (timeframe === "today") {
    return Array.from({ length: 24 }, (_, h) => ({
      label: `${h}:00`,
      amount: hourlyByHour.get(h) ?? 0,
    }));
  }

  if (timeframe === "week") {
    const nowLocal = DateTime.utc().setZone(tz).startOf("day");
    const mon = mondayOfWeekContaining(nowLocal);
    const order: string[] = [];
    for (let i = 0; i < 7; i += 1) {
      order.push(mon.plus({ days: i }).toFormat("yyyy-LL-dd"));
    }
    return order.map((ymd) => {
      const dl = DateTime.fromISO(ymd, { zone: tz }).startOf("day");
      return {
        label: dl.toFormat("ccc"),
        amount: dailyByYmd.get(ymd) ?? 0,
      };
    });
  }

  const nowLocal = DateTime.utc().setZone(tz);
  const monthStart = nowLocal.startOf("month");
  const daysInMonth = nowLocal.daysInMonth ?? 31;
  const orderKeys: string[] = [];
  for (let di = 0; di < daysInMonth; di += 1) {
    orderKeys.push(monthStart.plus({ days: di }).toFormat("yyyy-LL-dd"));
  }
  return orderKeys.map((ymd) => ({
    label: DateTime.fromISO(ymd, { zone: tz }).toFormat("dd"),
    amount: dailyByYmd.get(ymd) ?? 0,
  }));
}

const MONTH_CHART_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function buildBusinessDailyTipDistribution(
  tf: BusinessDashboardTimeframe,
  dailyByYmd: Map<string, number>,
  rangeStartUtc: Date,
  businessTimezone: string,
): { day: string; amount: number }[] {
  const tz = sanitizeIanaTimezone(businessTimezone);

  if (tf === "week") {
    const out: { day: string; amount: number }[] = [];
    let cur = DateTime.fromJSDate(rangeStartUtc, { zone: "utc" }).setZone(tz).startOf("day");
    for (let i = 0; i < 7; i++) {
      const key = cur.toFormat("yyyy-LL-dd");
      out.push({ day: cur.toFormat("ccc"), amount: dailyByYmd.get(key) ?? 0 });
      cur = cur.plus({ days: 1 });
    }
    return out;
  }

  if (tf === "month") {
    const out: { day: string; amount: number }[] = [];
    const monthStart = DateTime.fromJSDate(rangeStartUtc, { zone: "utc" }).setZone(tz).startOf("month");
    const daysInMonth = monthStart.daysInMonth ?? 31;
    for (let dom = 0; dom < daysInMonth; dom++) {
      const cur = monthStart.plus({ days: dom });
      const key = cur.toFormat("yyyy-LL-dd");
      out.push({ day: String(dom + 1), amount: dailyByYmd.get(key) ?? 0 });
    }
    return out;
  }

  const monthTotals = new Array(12).fill(0);
  for (const [ymd, amount] of dailyByYmd) {
    const monthIdx = Number(ymd.slice(5, 7)) - 1;
    if (monthIdx >= 0 && monthIdx < 12) monthTotals[monthIdx] += amount;
  }
  return MONTH_CHART_LABELS.map((day, i) => ({ day, amount: monthTotals[i] ?? 0 }));
}

export function buildYearChartFromMonthTotals(monthTotals: number[]): { day: string; amount: number }[] {
  return MONTH_CHART_LABELS.map((day, i) => ({ day, amount: monthTotals[i] ?? 0 }));
}

/** Fallback: build daily map from rows when SQL path is skipped. */
export function dailyMapFromTipRows(
  tipRows: ReadonlyArray<{ amount: unknown; createdAt: Date }>,
  businessTimezone: string,
): Map<string, number> {
  const tz = sanitizeIanaTimezone(businessTimezone);
  const byDay = new Map<string, number>();
  for (const t of tipRows) {
    const key = businessDayKey(t.createdAt, tz);
    byDay.set(key, (byDay.get(key) ?? 0) + Number(t.amount));
  }
  return byDay;
}
