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

  // Ensure walkthrough/demo accounts used in the UI exist and have visible dashboard data.
  const demoManagerEmail = "demo@caretip.de";
  const demoEmployeeEmail = "employee@caretip.de";

  const demoManager = await prisma.user.upsert({
    where: { email: demoManagerEmail },
    update: { role: "MANAGER", isPlatformAdmin: false, isActive: true, emailVerified: true },
    create: {
      email: demoManagerEmail,
      passwordHash,
      role: "MANAGER",
      isPlatformAdmin: false,
      isActive: true,
      emailVerified: true,
      hasCompletedOnboarding: true,
    },
  });

  const demoBusiness = await prisma.business.upsert({
    where: { userId: demoManager.id },
    update: { name: "CareTip Demo Venue", slug: "caretip-demo-venue", verificationStatus: "verified" },
    create: {
      name: "CareTip Demo Venue",
      slug: "caretip-demo-venue",
      userId: demoManager.id,
      verificationStatus: "verified",
      inviteCode: "DEMO-DE",
      businessType: "Restaurant",
      location: "Berlin, Germany",
      contactEmail: demoManagerEmail,
      legalContactName: "Demo Manager",
    },
  });

  const demoEmpUser = await prisma.user.upsert({
    where: { email: demoEmployeeEmail },
    update: { role: "EMPLOYEE", isPlatformAdmin: false, isActive: true, emailVerified: true },
    create: {
      email: demoEmployeeEmail,
      passwordHash,
      role: "EMPLOYEE",
      isPlatformAdmin: false,
      isActive: true,
      emailVerified: true,
      hasCompletedOnboarding: true,
    },
  });

  const demoEmployee = await prisma.employee.upsert({
    where: { userId: demoEmpUser.id },
    update: {
      name: "Demo Employee",
      jobTitle: "Server",
      slug: "caretip-demo-employee",
      businessId: demoBusiness.id,
      isActive: true,
      activationStatus: "active",
      monthlyGoal: 350,
    },
    create: {
      name: "Demo Employee",
      jobTitle: "Server",
      slug: "caretip-demo-employee",
      businessId: demoBusiness.id,
      userId: demoEmpUser.id,
      isActive: true,
      activationStatus: "active",
      monthlyGoal: 350,
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
    status: "success" | "pending" | "failed";
    payoutStatus: "pending" | "failed" | "not_applicable";
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
      const roll = Math.random();
      const status: "success" | "pending" | "failed" =
        roll < 0.82 ? "success" : roll < 0.92 ? "pending" : "failed";
      const amount =
        Math.round(
          (Math.random() * 28 + 4 + (status === "success" ? Math.random() * 2 : 0)) * 100,
        ) / 100;

      const createdAt = new Date(day);
      createdAt.setHours(randInt(10, 23), randInt(0, 59), randInt(0, 59), 0);

      transactions.push({
        amount,
        status,
        payoutStatus: status === "success" ? "pending" : status === "failed" ? "failed" : "not_applicable",
        employeeId: emp.id,
        businessId: emp.businessId,
        createdAt,
      });
    }
  }

  // Idempotent-ish per day: remove prior seed tips in the same date window, then insert fresh.
  // This keeps charts stable on reruns without touching real production data (script is env-guarded).
  await prisma.transaction.deleteMany({
    where: {
      createdAt: { gte: start, lte: new Date(end.getTime() + 24 * 60 * 60 * 1000 - 1) },
      stripePaymentIntentId: null,
    },
  });
  if (transactions.length > 0) {
    await prisma.transaction.createMany({ data: transactions });
  }

  // Ensure demo@caretip.de / employee@caretip.de dashboards always show tips + goal in the *current month*.
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 12, 0, 0, 0));
  await prisma.employeeGoal.upsert({
    where: { id: "seed-demo-employee-goal-monthly" },
    update: {
      employeeId: demoEmployee.id,
      name: "Monthly tip goal",
      goalAmount: 350,
      goalPeriod: "monthly",
      startDate: monthStart,
      status: "active",
    },
    create: {
      id: "seed-demo-employee-goal-monthly",
      employeeId: demoEmployee.id,
      name: "Monthly tip goal",
      goalAmount: 350,
      goalPeriod: "monthly",
      startDate: monthStart,
      status: "active",
    },
  });

  const demoTips: Array<{
    id: string;
    amount: number;
    status: "success" | "pending" | "failed";
    payoutStatus: "pending" | "failed" | "not_applicable";
    employeeId: string;
    businessId: string;
    createdAt: Date;
    stripePaymentIntentId: string | null;
  }> = [];
  for (let i = 0; i < 18; i += 1) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (i % 12));
    d.setUTCHours(12 + (i % 6), 10 + (i % 40), 0, 0);
    const roll = i % 10;
    const status: "success" | "pending" | "failed" = roll < 8 ? "success" : roll === 8 ? "pending" : "failed";
    demoTips.push({
      id: `seed-demo-tip-${String(i + 1).padStart(3, "0")}`,
      amount: Math.round((6 + Math.random() * 22) * 100) / 100,
      status,
      payoutStatus: status === "success" ? "pending" : status === "failed" ? "failed" : "not_applicable",
      employeeId: demoEmployee.id,
      businessId: demoBusiness.id,
      createdAt: d,
      stripePaymentIntentId: null,
    });
  }
  for (const t of demoTips) {
    await prisma.transaction.upsert({
      where: { id: t.id },
      update: {
        amount: t.amount,
        status: t.status,
        payoutStatus: t.payoutStatus,
        employeeId: t.employeeId,
        businessId: t.businessId,
        createdAt: t.createdAt,
        stripePaymentIntentId: null,
      },
      create: t,
    });
  }

  console.log("Platform analytics demo seed completed.");
  console.log(`- Admin ensured: admin@caretip.de (password: ${defaultPassword})`);
  console.log(`- Demo manager ensured: ${demoManagerEmail}`);
  console.log(`- Demo employee ensured: ${demoEmployeeEmail}`);
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

