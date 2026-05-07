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

/** Analytics aggregates for Super Admin dashboard charts (Postgres/Supabase). */
export async function getPlatformAnalytics(input?: { days?: unknown }): Promise<PlatformAnalyticsResponse> {
  const rangeDays = clampDays(input?.days, 30);

  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (rangeDays - 1));
  start.setHours(0, 0, 0, 0);

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

  const growthRows = await prisma.$queryRaw<
    Array<{
      d: string;
      new_users: number;
      new_businesses: number;
      new_tips: number;
    }>
  >`
    WITH days AS (
      SELECT generate_series(${start}::timestamptz, ${end}::timestamptz, interval '1 day')::date AS d
    )
    SELECT
      days.d::text AS d,
      COALESCE(u.c, 0)::int AS new_users,
      COALESCE(b.c, 0)::int AS new_businesses,
      COALESCE(t.c, 0)::int AS new_tips
    FROM days
    LEFT JOIN (
      SELECT date_trunc('day', created_at)::date AS d, COUNT(*) AS c
      FROM "User"
      WHERE created_at >= ${start} AND created_at <= ${end}
      GROUP BY 1
    ) u ON u.d = days.d
    LEFT JOIN (
      SELECT date_trunc('day', created_at)::date AS d, COUNT(*) AS c
      FROM businesses
      WHERE created_at >= ${start} AND created_at <= ${end}
      GROUP BY 1
    ) b ON b.d = days.d
    LEFT JOIN (
      SELECT date_trunc('day', created_at)::date AS d, COUNT(*) AS c
      FROM tips
      WHERE created_at >= ${start} AND created_at <= ${end}
      GROUP BY 1
    ) t ON t.d = days.d
    ORDER BY days.d ASC;
  `;

  const tipVolumeRows = await prisma.$queryRaw<
    Array<{ d: string; tips_eur: number; tip_count: number }>
  >`
    WITH days AS (
      SELECT generate_series(${start}::timestamptz, ${end}::timestamptz, interval '1 day')::date AS d
    )
    SELECT
      days.d::text AS d,
      COALESCE(v.sum_amount, 0)::float AS tips_eur,
      COALESCE(v.c, 0)::int AS tip_count
    FROM days
    LEFT JOIN (
      SELECT date_trunc('day', created_at)::date AS d, SUM(amount)::float AS sum_amount, COUNT(*) AS c
      FROM tips
      WHERE status = 'success' AND created_at >= ${start} AND created_at <= ${end}
      GROUP BY 1
    ) v ON v.d = days.d
    ORDER BY days.d ASC;
  `;

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
    growth: growthRows.map((r) => ({
      date: r.d.slice(0, 10),
      newUsers: Number(r.new_users ?? 0),
      newBusinesses: Number(r.new_businesses ?? 0),
      newTips: Number(r.new_tips ?? 0),
    })),
    tipVolume: tipVolumeRows.map((r) => ({
      date: r.d.slice(0, 10),
      tipsEur: Number(r.tips_eur ?? 0),
      tipCount: Number(r.tip_count ?? 0),
    })),
    topBusinessesByTips,
  };
}

