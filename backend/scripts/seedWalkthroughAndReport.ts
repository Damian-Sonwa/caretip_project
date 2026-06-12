/**
 * Seeds walkthrough demo accounts only (demo@ / employee@ / admin@caretip.de) and prints IDs + auth smoke.
 * Run: npx tsx scripts/seedWalkthroughAndReport.ts
 */
import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";
import { login } from "../src/services/auth.service.js";
import { invalidateBusinessStatsCache } from "../src/services/business.service.js";
import {
  seedWalkthroughDemo,
  WALKTHROUGH_DEMO_ADMIN_EMAIL,
  WALKTHROUGH_DEMO_EMPLOYEE_EMAIL,
  WALKTHROUGH_DEMO_MANAGER_EMAIL,
  WALKTHROUGH_DEMO_MANAGER_PASSWORD,
} from "../prisma/seedWalkthroughDemo.js";

function dbTarget() {
  const raw = process.env.DATABASE_URL ?? "";
  try {
    const u = new URL(raw.replace(/^postgresql:\/\//i, "http:"));
    const ref = u.username.includes(".") ? u.username.split(".")[1] : u.username;
    return {
      host: u.hostname,
      port: u.port || "5432",
      database: u.pathname.replace(/^\//, "") || "postgres",
      projectRef: ref ?? null,
      environment:
        process.env.NODE_ENV === "production"
          ? "production"
          : process.env.RENDER === "true"
            ? "production"
            : "development",
    };
  } catch {
    return { host: "(parse failed)", database: "postgres", environment: process.env.NODE_ENV ?? "development" };
  }
}

async function main() {
  const target = dbTarget();
  console.log("Database target:", JSON.stringify(target, null, 2));

  await seedWalkthroughDemo(prisma);

  const managerAfterSeed = await prisma.user.findUnique({
    where: { email: WALKTHROUGH_DEMO_MANAGER_EMAIL },
    include: { business: { select: { id: true } } },
  });
  if (managerAfterSeed?.business?.id) {
    invalidateBusinessStatsCache(managerAfterSeed.business.id);
  }

  const [manager, employee, admin] = await Promise.all([
    prisma.user.findUnique({
      where: { email: WALKTHROUGH_DEMO_MANAGER_EMAIL },
      include: { business: { select: { id: true, name: true } } },
    }),
    prisma.user.findUnique({
      where: { email: WALKTHROUGH_DEMO_EMPLOYEE_EMAIL },
      include: { employee: { select: { id: true, businessId: true } } },
    }),
    prisma.user.findUnique({
      where: { email: WALKTHROUGH_DEMO_ADMIN_EMAIL },
      select: { id: true, role: true, isPlatformAdmin: true, isActive: true, emailVerified: true },
    }),
  ]);

  const accounts = [
    {
      label: "Business (MANAGER)",
      email: WALKTHROUGH_DEMO_MANAGER_EMAIL,
      password: WALKTHROUGH_DEMO_MANAGER_PASSWORD,
      intendedRole: "MANAGER" as const,
      user: manager,
      businessId: manager?.business?.id ?? null,
      employeeId: null,
    },
    {
      label: "Employee",
      email: WALKTHROUGH_DEMO_EMPLOYEE_EMAIL,
      password: WALKTHROUGH_DEMO_MANAGER_PASSWORD,
      intendedRole: "EMPLOYEE" as const,
      user: employee,
      businessId: employee?.employee?.businessId ?? null,
      employeeId: employee?.employee?.id ?? null,
    },
    {
      label: "Platform Admin (SUPER_ADMIN)",
      email: WALKTHROUGH_DEMO_ADMIN_EMAIL,
      password: WALKTHROUGH_DEMO_MANAGER_PASSWORD,
      intendedRole: "SUPER_ADMIN" as const,
      user: admin,
      businessId: null,
      employeeId: null,
    },
  ];

  console.log("\n── Demo accounts ──\n");
  for (const a of accounts) {
    console.log(`${a.label}`);
    console.log(`  Email:       ${a.email}`);
    console.log(`  Password:    ${a.password}`);
    console.log(`  User ID:     ${a.user?.id ?? "(missing)"}`);
    console.log(`  Business ID: ${a.businessId ?? "n/a"}`);
    console.log(`  Employee ID: ${a.employeeId ?? "n/a"}`);
    if (a.user && "role" in a.user) {
      console.log(`  Role:        ${a.user.role}`);
    }
    try {
      const auth = await login({
        email: a.email,
        password: a.password,
        intendedRole: a.intendedRole,
      });
      console.log(`  Auth:        OK (${auth.user.role})`);
    } catch (e) {
      console.log(`  Auth:        FAILED — ${e instanceof Error ? e.message : e}`);
    }
    console.log("");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
