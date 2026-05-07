import "dotenv/config";
import bcrypt from "bcrypt";
import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";

function clampInt(n: number, min: number, max: number) {
  const x = Number.isFinite(n) ? Math.floor(n) : min;
  return Math.min(Math.max(x, min), max);
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: readonly T[]) {
  return arr[randInt(0, arr.length - 1)]!;
}

function makeSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 40);
}

async function main() {
  // Safety: never run unless explicitly enabled.
  if (process.env.SEED_PLATFORM_ANALYTICS_DEMO !== "true") {
    console.log(
      "Seed skipped. Set SEED_PLATFORM_ANALYTICS_DEMO=true to generate demo analytics data.",
    );
    return;
  }

  const days = clampInt(Number(process.env.SEED_DAYS ?? 45), 14, 120);
  const businessesCount = clampInt(Number(process.env.SEED_BUSINESSES ?? 8), 5, 15);
  const defaultPassword = process.env.SEED_PASSWORD ?? "password123";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // Ensure the real platform admin exists and is active.
  await prisma.user.upsert({
    where: { email: "admin@caretip.de" },
    update: { role: "SUPER_ADMIN", isPlatformAdmin: true, isActive: true, emailVerified: true },
    create: {
      email: "admin@caretip.de",
      passwordHash,
      role: "SUPER_ADMIN",
      isPlatformAdmin: true,
      isActive: true,
      emailVerified: true,
    },
  });

  const businessNames = [
    "Cafe Sonnenberg",
    "The Copper Spoon",
    "Bistro Linden",
    "Hotel Aurora",
    "Salon Nova",
    "Brasserie Hafenblick",
    "Riverside Grill",
    "Olive & Thyme",
    "Kaffeehaus Mitte",
    "Skyline Lounge",
    "La Piazza",
  ] as const;

  const employeeFirstNames = [
    "Sarah",
    "Marcus",
    "Elena",
    "Noah",
    "Amina",
    "Luca",
    "Mia",
    "Jonas",
    "Sofia",
    "Tariq",
    "Isla",
    "Kai",
    "Lea",
    "Nina",
    "Omar",
  ] as const;

  const employeeLastNames = [
    "Chen",
    "Johnson",
    "Rodriguez",
    "Müller",
    "Schmidt",
    "Klein",
    "Weber",
    "Fischer",
    "Wagner",
    "Hoffmann",
    "Dubois",
    "Rossi",
    "Silva",
    "Nowak",
  ] as const;

  const jobTitles = ["Server", "Bartender", "Host", "Barista", "Reception"] as const;

  const createdBusinesses: Array<{ id: string; name: string }> = [];
  const createdEmployees: Array<{ id: string; businessId: string }> = [];

  for (let i = 0; i < businessesCount; i += 1) {
    const name = businessNames[i % businessNames.length]!;
    const slug = `${makeSlug(name)}-${i + 1}`;
    const ownerEmail = `owner+${slug}@caretip.de`;

    const owner = await prisma.user.upsert({
      where: { email: ownerEmail },
      update: { role: "MANAGER", isPlatformAdmin: false, isActive: true, emailVerified: true },
      create: {
        email: ownerEmail,
        passwordHash,
        role: "MANAGER",
        isPlatformAdmin: false,
        isActive: true,
        emailVerified: true,
      },
    });

    const business = await prisma.business.upsert({
      where: { userId: owner.id },
      update: { name, slug, verificationStatus: "verified" },
      create: {
        name,
        slug,
        verificationStatus: "verified",
        userId: owner.id,
        inviteCode: `DEMO${String(i + 1).padStart(2, "0")}`,
      },
    });

    createdBusinesses.push({ id: business.id, name: business.name });

    const employeesForBiz = randInt(4, 8);
    for (let j = 0; j < employeesForBiz; j += 1) {
      const fullName = `${pick(employeeFirstNames)} ${pick(employeeLastNames)}`;
      const empEmail = `staff+${slug}-${j + 1}@caretip.de`;
      const user = await prisma.user.upsert({
        where: { email: empEmail },
        update: { role: "EMPLOYEE", isPlatformAdmin: false, isActive: true, emailVerified: true },
        create: {
          email: empEmail,
          passwordHash,
          role: "EMPLOYEE",
          isPlatformAdmin: false,
          isActive: true,
          emailVerified: true,
        },
      });

      const employee = await prisma.employee.upsert({
        where: { userId: user.id },
        update: { name: fullName, jobTitle: pick(jobTitles), businessId: business.id },
        create: {
          name: fullName,
          jobTitle: pick(jobTitles),
          businessId: business.id,
          userId: user.id,
          activationStatus: "active",
          isActive: true,
        },
      });

      createdEmployees.push({ id: employee.id, businessId: business.id });
    }
  }

  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));

  // Generate realistic activity: some days quiet, weekends busier.
  const transactions: Array<{
    amount: number;
    status: "success" | "pending";
    payoutStatus: "pending" | "not_applicable";
    employeeId: string;
    businessId: string;
    createdAt: Date;
  }> = [];

  for (let di = 0; di < days; di += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + di);
    const dow = day.getDay(); // 0 Sun ... 6 Sat
    const weekendBoost = dow === 0 || dow === 5 || dow === 6 ? 1.35 : 1.0;

    const base = randInt(18, 45); // platform-wide transactions/day baseline
    const dayTxCount = Math.max(0, Math.floor(base * weekendBoost + randInt(-8, 10)));

    for (let t = 0; t < dayTxCount; t += 1) {
      const emp = pick(createdEmployees);
      const isSuccess = Math.random() < 0.86;
      const amount =
        Math.round(
          (Math.random() * 28 + 4 + (isSuccess ? Math.random() * 2 : 0)) * 100,
        ) / 100;

      const createdAt = new Date(day);
      createdAt.setHours(randInt(10, 23), randInt(0, 59), randInt(0, 59), 0);

      transactions.push({
        amount,
        status: isSuccess ? "success" : "pending",
        payoutStatus: isSuccess ? "pending" : "not_applicable",
        employeeId: emp.id,
        businessId: emp.businessId,
        createdAt,
      });
    }
  }

  // CreateMany for speed; duplicates are fine (this is demo analytics, not idempotent).
  // If you want to rerun, either clear tips first or accept more activity (charts still look realistic).
  if (transactions.length > 0) {
    await prisma.transaction.createMany({ data: transactions });
  }

  console.log("Platform analytics demo seed completed.");
  console.log(`- Admin ensured: admin@caretip.de (password: ${defaultPassword})`);
  console.log(`- Businesses created/updated: ${createdBusinesses.length}`);
  console.log(`- Employees created/updated: ${createdEmployees.length}`);
  console.log(`- Tips inserted: ${transactions.length}`);
  console.log(`- Range: last ${days} days`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

