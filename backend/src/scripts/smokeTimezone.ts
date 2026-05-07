import dotenv from "dotenv";
import { prisma } from "../prisma.js";
import { sanitizeIanaTimezone, businessUtcRangeForTimeframe, businessDayKey } from "../utils/businessTime.js";

dotenv.config({ path: "../.env" });
dotenv.config({ path: ".env" });

async function main() {
  const business = await prisma.business.findFirst({
    select: { id: true, name: true, timezone: true },
  });

  if (!business) {
    console.log("No business found. Create/seed data first.");
    return;
  }

  const tz = sanitizeIanaTimezone((business as any).timezone);
  console.log("Business", { id: business.id, name: business.name, timezone: tz });

  const month = businessUtcRangeForTimeframe("month", tz);
  if (!month) {
    console.log("Could not compute month range.");
    return;
  }

  const tips = await prisma.transaction.findMany({
    where: { businessId: business.id, status: "success", createdAt: { gte: month.startUtc, lt: month.endUtc } },
    select: { id: true, amount: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const byDay = new Map<string, number>();
  for (const t of tips) {
    const key = businessDayKey(t.createdAt, tz);
    byDay.set(key, (byDay.get(key) ?? 0) + Number(t.amount));
  }

  console.log("Month range UTC", { startUtc: month.startUtc.toISOString(), endUtc: month.endUtc.toISOString() });
  console.log("Recent tips (max 10)", tips.map((t) => ({ id: t.id, amount: Number(t.amount), createdAt: t.createdAt.toISOString() })));
  console.log("Recent tips grouped by local day", Object.fromEntries(byDay.entries()));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

