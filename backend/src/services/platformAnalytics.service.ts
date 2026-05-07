import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";

export type PlatformAnalyticsResponse = {
  rangeDays: number;
  userDistribution: Array<{ role: "business" | "employee" | "platform_admin"; count: number }>;
  tipStatus: Array<{ status: "success" | "pending" | "failed"; count: number }>;
  /** Daily growth series for the last N days (inclusive). */
  growth: Array<{
    date: string; // YYYY-MM-DD
    newUsers: number;
    newBusinesses: number;
    newTips: number;
  }>;
  /** Daily successful tip volume + count. */
  tipVolume: Array<{
    date: string; // YYYY-MM-DD
    tipsEur: number;
    tipCount: number;
  }>;
  /** Top businesses by successful tip volume (for bar chart). */
  topBusinessesByTips: Array<{
    businessId: string;
    businessName: string;
    tipsEur: number;
  }>;
};

function clampDays(raw: unknown, fallback: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.floor(n), 7), 120);
}

function dateIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function eachDayIso(start: Date, end: Date): string[] {
  const out: string[] = [];
  const cur = new Date(start);
  cur.setHours(0, 0, 0, 0);
  const stop = new Date(end);
  stop.setHours(0, 0, 0, 0);
  while (cur.getTime() <= stop.getTime()) {
    out.push(dateIso(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

async function resolveCreatedAtColumn(tableName: string): Promise<string | null> {
  // Some deployed DBs historically used camelCase columns; newer ones use snake_case via @map("created_at").
  // Detect without crashing so analytics stays accurate across environments.
  const rows = await prisma.$queryRaw<Array<{ column_name: string }>>(Prisma.sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
      AND column_name IN ('created_at', 'createdAt')
    ORDER BY CASE column_name WHEN 'created_at' THEN 0 ELSE 1 END;
  `);
  const col = rows?.[0]?.column_name;
  if (col === "created_at" || col === "createdAt") return col;
  return null;
}

function colIdent(col: string) {
  // Safe identifier injection from a tiny allowlist.
  if (col === "created_at") return Prisma.raw("created_at");
  if (col === "createdAt") return Prisma.raw("\"createdAt\"");
  throw new Error(`Unsupported column identifier: ${col}`);
}

/** Analytics aggregates for Super Admin dashboard charts (Postgres/Supabase). */
export async function getPlatformAnalytics(input?: { days?: unknown }): Promise<PlatformAnalyticsResponse> {
  const rangeDays = clampDays(input?.days, 30);

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (rangeDays - 1));
  start.setHours(0, 0, 0, 0);

  const [userCreatedCol, bizCreatedCol, tipCreatedCol] = await Promise.all([
    resolveCreatedAtColumn("User"),
    resolveCreatedAtColumn("businesses"),
    resolveCreatedAtColumn("tips"),
  ]);

  const [managerCount, employeeCount, adminCount] = await Promise.all([
    prisma.user.count({ where: { role: "MANAGER" } }),
    prisma.user.count({ where: { role: "EMPLOYEE" } }),
    prisma.user.count({ where: { role: "SUPER_ADMIN" } }),
  ]);

  const tipStatusRows = await prisma.transaction.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const tipStatus: PlatformAnalyticsResponse["tipStatus"] = [
    { status: "success", count: 0 },
    { status: "pending", count: 0 },
    { status: "failed", count: 0 },
  ];
  for (const r of tipStatusRows) {
    const s = String(r.status);
    if (s === "success" || s === "pending" || s === "failed") {
      tipStatus.find((x) => x.status === s)!.count = r._count._all;
    }
  }

  // Safer production SQL (no generate_series): aggregate per-table and fill gaps in JS.
  const usersDaily = userCreatedCol
    ? await prisma.$queryRaw<Array<{ d: string; c: number }>>(Prisma.sql`
        SELECT date_trunc('day', ${colIdent(userCreatedCol)})::date::text AS d, COUNT(*)::int AS c
        FROM "User"
        WHERE ${colIdent(userCreatedCol)} >= ${start} AND ${colIdent(userCreatedCol)} <= ${end}
        GROUP BY 1
        ORDER BY 1 ASC;
      `)
    : [];

  const businessesDaily = bizCreatedCol
    ? await prisma.$queryRaw<Array<{ d: string; c: number }>>(Prisma.sql`
        SELECT date_trunc('day', ${colIdent(bizCreatedCol)})::date::text AS d, COUNT(*)::int AS c
        FROM businesses
        WHERE ${colIdent(bizCreatedCol)} >= ${start} AND ${colIdent(bizCreatedCol)} <= ${end}
        GROUP BY 1
        ORDER BY 1 ASC;
      `)
    : [];

  const tipsDaily = tipCreatedCol
    ? await prisma.$queryRaw<Array<{ d: string; c: number }>>(Prisma.sql`
        SELECT date_trunc('day', ${colIdent(tipCreatedCol)})::date::text AS d, COUNT(*)::int AS c
        FROM tips
        WHERE ${colIdent(tipCreatedCol)} >= ${start} AND ${colIdent(tipCreatedCol)} <= ${end}
        GROUP BY 1
        ORDER BY 1 ASC;
      `)
    : [];

  const tipVolumeDaily = tipCreatedCol
    ? await prisma.$queryRaw<Array<{ d: string; tips_eur: number; tip_count: number }>>(Prisma.sql`
        SELECT
          date_trunc('day', ${colIdent(tipCreatedCol)})::date::text AS d,
          COALESCE(SUM(amount), 0)::float AS tips_eur,
          COUNT(*)::int AS tip_count
        FROM tips
        WHERE status = 'success'
          AND ${colIdent(tipCreatedCol)} >= ${start}
          AND ${colIdent(tipCreatedCol)} <= ${end}
        GROUP BY 1
        ORDER BY 1 ASC;
      `)
    : [];

  const dayKeys = eachDayIso(start, end);
  const mapCount = (rows: Array<{ d: string; c: number }>) => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(String(r.d).slice(0, 10), Number(r.c ?? 0));
    return m;
  };
  const mapUsers = mapCount(usersDaily);
  const mapBiz = mapCount(businessesDaily);
  const mapTips = mapCount(tipsDaily);
  const mapTipVol = new Map<string, { tipsEur: number; tipCount: number }>();
  for (const r of tipVolumeDaily) {
    mapTipVol.set(String(r.d).slice(0, 10), {
      tipsEur: Number(r.tips_eur ?? 0),
      tipCount: Number(r.tip_count ?? 0),
    });
  }

  const topBusinesses = await prisma.transaction.groupBy({
    by: ["businessId"],
    where: { status: "success" },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 7,
  });
  const topBusinessIds = topBusinesses.map((r) => r.businessId);
  const businessNames = await prisma.business.findMany({
    where: { id: { in: topBusinessIds } },
    select: { id: true, name: true },
  });
  const nameMap = new Map(businessNames.map((b) => [b.id, b.name]));
  const topBusinessesByTips = topBusinesses.map((r) => ({
    businessId: r.businessId,
    businessName: nameMap.get(r.businessId) ?? "Unknown",
    tipsEur: Number(r._sum.amount ?? 0),
  }));

  return {
    rangeDays,
    userDistribution: [
      { role: "business", count: managerCount },
      { role: "employee", count: employeeCount },
      { role: "platform_admin", count: adminCount },
    ],
    tipStatus,
    growth: dayKeys.map((d) => ({
      date: d,
      newUsers: mapUsers.get(d) ?? 0,
      newBusinesses: mapBiz.get(d) ?? 0,
      newTips: mapTips.get(d) ?? 0,
    })),
    tipVolume: dayKeys.map((d) => ({
      date: d,
      tipsEur: mapTipVol.get(d)?.tipsEur ?? 0,
      tipCount: mapTipVol.get(d)?.tipCount ?? 0,
    })),
    topBusinessesByTips,
  };
}

