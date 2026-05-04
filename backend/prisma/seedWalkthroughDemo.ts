/**
 * Product walkthrough / stakeholder demo: one manager account, verified venue, staff, tables, and tips.
 * Run via `npm run db:seed` (invoked from `seed.ts`). Safe to re-run (upserts).
 */
import bcrypt from "bcrypt";
import type { PrismaClient } from "@prisma/client";

export const WALKTHROUGH_DEMO_MANAGER_EMAIL = "demo@caretip.de".toLowerCase();
export const WALKTHROUGH_DEMO_MANAGER_PASSWORD = "Demo1234!";
export const WALKTHROUGH_DEMO_EMPLOYEE_EMAIL = "employee@caretip.de".toLowerCase();
export const WALKTHROUGH_DEMO_ADMIN_EMAIL = "admin@caretip.de".toLowerCase();

const BUSINESS_NAME = "Brasserie Lindenstraße";
const BUSINESS_SLUG = "brasserie-lindenstrasse";
const LOCATION_MAIN_ID = "clwkdemov2locmain01xxxxx";
const LOCATION_GARDEN_ID = "clwkdemov2locgart01xxxxx";
const TABLE_QR_MAIN = "wd-brasserie-table-main-01";
const TABLE_QR_GARDEN = "wd-brasserie-table-patio-02";
/** Canonical staff tip URL: `/{businessSlug}/{slug}` — globally unique. */
const DEMO_PRIMARY_EMPLOYEE_SLUG = "wd-brasserie-employee-demo";

const STAFF = [
  {
    email: "anna.staff.demo@caretip.de",
    name: "Anna Müller",
    jobTitle: "Head server",
    slug: "wd-brasserie-anna",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
  },
  {
    email: "sam.staff.demo@caretip.de",
    name: "Sam Winters",
    jobTitle: "Bartender",
    slug: "wd-brasserie-sam",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
  },
  {
    email: "jordan.staff.demo@caretip.de",
    name: "Jordan Park",
    jobTitle: "Host",
    slug: "wd-brasserie-jordan",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
  },
] as const;

function staggeredTipDate(daysAgo: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(12 + (daysAgo % 5), 10 + (daysAgo % 40), 0, 0);
  return d;
}

export async function seedWalkthroughDemo(prisma: PrismaClient): Promise<void> {
  const passwordHash = await bcrypt.hash(WALKTHROUGH_DEMO_MANAGER_PASSWORD, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: WALKTHROUGH_DEMO_ADMIN_EMAIL },
    update: {
      role: "SUPER_ADMIN",
      isPlatformAdmin: true,
      isActive: true,
      emailVerified: true,
      hasCompletedOnboarding: true,
      passwordHash,
    },
    create: {
      email: WALKTHROUGH_DEMO_ADMIN_EMAIL,
      passwordHash,
      role: "SUPER_ADMIN",
      isPlatformAdmin: true,
      isActive: true,
      emailVerified: true,
      hasCompletedOnboarding: true,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: WALKTHROUGH_DEMO_MANAGER_EMAIL },
    update: {
      role: "MANAGER",
      isActive: true,
      isPlatformAdmin: false,
      emailVerified: true,
      hasCompletedOnboarding: true,
      passwordHash,
    },
    create: {
      email: WALKTHROUGH_DEMO_MANAGER_EMAIL,
      passwordHash,
      role: "MANAGER",
      isActive: true,
      isPlatformAdmin: false,
      emailVerified: true,
      hasCompletedOnboarding: true,
    },
  });

  let slug = BUSINESS_SLUG;
  const slugTaken = await prisma.business.findFirst({
    where: { slug, NOT: { userId: manager.id } },
    select: { id: true },
  });
  if (slugTaken) {
    slug = `${BUSINESS_SLUG}-walkthrough`;
  }

  const business = await prisma.business.upsert({
    where: { userId: manager.id },
    update: {
      name: BUSINESS_NAME,
      slug,
      verificationStatus: "verified",
      businessType: "Restaurant",
      location: "Berlin-Mitte, Germany",
      registeredAddress: "Lindenstraße 42, 10969 Berlin",
      contactEmail: WALKTHROUGH_DEMO_MANAGER_EMAIL,
      legalContactName: "Demo Manager",
    },
    create: {
      name: BUSINESS_NAME,
      slug,
      userId: manager.id,
      verificationStatus: "verified",
      businessType: "Restaurant",
      location: "Berlin-Mitte, Germany",
      registeredAddress: "Lindenstraße 42, 10969 Berlin",
      contactEmail: WALKTHROUGH_DEMO_MANAGER_EMAIL,
      legalContactName: "Demo Manager",
    },
  });

  const locMain = await prisma.location.upsert({
    where: { id: LOCATION_MAIN_ID },
    update: { name: "Main dining room", businessId: business.id },
    create: {
      id: LOCATION_MAIN_ID,
      name: "Main dining room",
      description: "Walkthrough demo — indoor seating.",
      businessId: business.id,
    },
  });

  const locGarden = await prisma.location.upsert({
    where: { id: LOCATION_GARDEN_ID },
    update: { name: "Garden terrace", businessId: business.id },
    create: {
      id: LOCATION_GARDEN_ID,
      name: "Garden terrace",
      description: "Walkthrough demo — outdoor terrace.",
      businessId: business.id,
    },
  });

  await prisma.table.upsert({
    where: { qrSlug: TABLE_QR_MAIN },
    update: { name: "Table 12 — Window", locationId: locMain.id },
    create: {
      name: "Table 12 — Window",
      qrSlug: TABLE_QR_MAIN,
      locationId: locMain.id,
    },
  });

  await prisma.table.upsert({
    where: { qrSlug: TABLE_QR_GARDEN },
    update: { name: "Table 4 — Patio", locationId: locGarden.id },
    create: {
      name: "Table 4 — Patio",
      qrSlug: TABLE_QR_GARDEN,
      locationId: locGarden.id,
    },
  });

  const tableMain = await prisma.table.findUniqueOrThrow({ where: { qrSlug: TABLE_QR_MAIN } });
  const tableGarden = await prisma.table.findUniqueOrThrow({ where: { qrSlug: TABLE_QR_GARDEN } });

  const employeeRows: { id: string; userId: string }[] = [];

  for (const s of STAFF) {
    const eu = await prisma.user.upsert({
      where: { email: s.email },
      update: {
        role: "EMPLOYEE",
        isActive: true,
        emailVerified: true,
        passwordHash,
      },
      create: {
        email: s.email,
        passwordHash,
        role: "EMPLOYEE",
        isActive: true,
        emailVerified: true,
      },
    });

    const emp = await prisma.employee.upsert({
      where: { userId: eu.id },
      update: {
        name: s.name,
        jobTitle: s.jobTitle,
        slug: s.slug,
        avatar: s.avatar,
        businessId: business.id,
        locationId: locMain.id,
        isActive: true,
        activationStatus: "active",
      },
      create: {
        name: s.name,
        jobTitle: s.jobTitle,
        slug: s.slug,
        avatar: s.avatar,
        businessId: business.id,
        userId: eu.id,
        locationId: locMain.id,
        isActive: true,
        activationStatus: "active",
      },
    });
    employeeRows.push({ id: emp.id, userId: eu.id });
  }

  const demoEmpUser = await prisma.user.upsert({
    where: { email: WALKTHROUGH_DEMO_EMPLOYEE_EMAIL },
    update: {
      role: "EMPLOYEE",
      isActive: true,
      isPlatformAdmin: false,
      emailVerified: true,
      hasCompletedOnboarding: true,
      passwordHash,
    },
    create: {
      email: WALKTHROUGH_DEMO_EMPLOYEE_EMAIL,
      passwordHash,
      role: "EMPLOYEE",
      isActive: true,
      isPlatformAdmin: false,
      emailVerified: true,
      hasCompletedOnboarding: true,
    },
  });

  const demoPrimaryEmployee = await prisma.employee.upsert({
    where: { userId: demoEmpUser.id },
    update: {
      name: "Mina Schmidt",
      jobTitle: "Senior server",
      slug: DEMO_PRIMARY_EMPLOYEE_SLUG,
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      businessId: business.id,
      locationId: locMain.id,
      isActive: true,
      activationStatus: "active",
    },
    create: {
      name: "Mina Schmidt",
      jobTitle: "Senior server",
      slug: DEMO_PRIMARY_EMPLOYEE_SLUG,
      avatar:
        "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      businessId: business.id,
      userId: demoEmpUser.id,
      locationId: locMain.id,
      isActive: true,
      activationStatus: "active",
    },
  });

  employeeRows.push({ id: demoPrimaryEmployee.id, userId: demoEmpUser.id });

  const [e0, e1] = employeeRows;
  if (e0 && e1) {
    await prisma.employeeTableAssignment.upsert({
      where: { employeeId_tableId: { employeeId: e0.id, tableId: tableMain.id } },
      update: { employeeName: STAFF[0].name },
      create: {
        employeeId: e0.id,
        tableId: tableMain.id,
        employeeName: STAFF[0].name,
      },
    });
    await prisma.employeeTableAssignment.upsert({
      where: { employeeId_tableId: { employeeId: e1.id, tableId: tableGarden.id } },
      update: { employeeName: STAFF[1].name },
      create: {
        employeeId: e1.id,
        tableId: tableGarden.id,
        employeeName: STAFF[1].name,
      },
    });
  }

  await prisma.employeeTableAssignment.upsert({
    where: {
      employeeId_tableId: { employeeId: demoPrimaryEmployee.id, tableId: tableGarden.id },
    },
    update: { employeeName: "Mina Schmidt" },
    create: {
      employeeId: demoPrimaryEmployee.id,
      tableId: tableGarden.id,
      employeeName: "Mina Schmidt",
    },
  });

  const tipAmounts = [8.5, 12, 15, 22, 6, 18, 9.5, 25, 11, 14, 7, 20, 16, 13.5, 19, 10, 24, 8, 17, 21, 12.5];
  for (let i = 0; i < tipAmounts.length; i++) {
    const emp = employeeRows[i % employeeRows.length];
    if (!emp) continue;
    const id = `wdemotip${String(i + 1).padStart(3, "0")}`;
    await prisma.transaction.upsert({
      where: { id },
      update: {
        amount: tipAmounts[i]!,
        status: "success",
        payoutStatus: "pending",
        employeeId: emp.id,
        businessId: business.id,
        locationId: locMain.id,
        tableId: i % 2 === 0 ? tableMain.id : tableGarden.id,
        createdAt: staggeredTipDate(i % 18),
      },
      create: {
        id,
        amount: tipAmounts[i]!,
        status: "success",
        payoutStatus: "pending",
        employeeId: emp.id,
        businessId: business.id,
        locationId: locMain.id,
        tableId: i % 2 === 0 ? tableMain.id : tableGarden.id,
        createdAt: staggeredTipDate(i % 18),
      },
    });
  }

  const demoEmpExtraAmounts = [14, 18, 9, 21, 11, 16, 13, 19, 10, 12, 17];
  for (let j = 0; j < demoEmpExtraAmounts.length; j++) {
    const id = `wdemotip${String(22 + j).padStart(3, "0")}`;
    await prisma.transaction.upsert({
      where: { id },
      update: {
        amount: demoEmpExtraAmounts[j]!,
        status: "success",
        payoutStatus: "pending",
        employeeId: demoPrimaryEmployee.id,
        businessId: business.id,
        locationId: locGarden.id,
        tableId: tableGarden.id,
        createdAt: staggeredTipDate((j + 3) % 18),
      },
      create: {
        id,
        amount: demoEmpExtraAmounts[j]!,
        status: "success",
        payoutStatus: "pending",
        employeeId: demoPrimaryEmployee.id,
        businessId: business.id,
        locationId: locGarden.id,
        tableId: tableGarden.id,
        createdAt: staggeredTipDate((j + 3) % 18),
      },
    });
  }

  const now = new Date();
  const goalMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 12, 0, 0, 0));

  const firstEmp = employeeRows[0];
  if (firstEmp) {
    await prisma.employeeGoal.upsert({
      where: { employeeId: firstEmp.id },
      update: {
        goalAmount: 500,
        goalPeriod: "monthly",
        startDate: goalMonthStart,
      },
      create: {
        employeeId: firstEmp.id,
        goalAmount: 500,
        goalPeriod: "monthly",
        startDate: goalMonthStart,
      },
    });
  }

  await prisma.employeeGoal.upsert({
    where: { employeeId: demoPrimaryEmployee.id },
    update: {
      goalAmount: 350,
      goalPeriod: "monthly",
      startDate: goalMonthStart,
    },
    create: {
      employeeId: demoPrimaryEmployee.id,
      goalAmount: 350,
      goalPeriod: "monthly",
      startDate: goalMonthStart,
    },
  });

  await prisma.auditLog.deleteMany({
    where: {
      userId: adminUser.id,
      action: { startsWith: "walkthrough_demo." },
    },
  });
  await prisma.auditLog.createMany({
    data: [
      {
        userId: adminUser.id,
        action: "walkthrough_demo.seed",
        metadata: "Platform audit trail (product tour).",
      },
      {
        userId: adminUser.id,
        action: "walkthrough_demo.business_directory",
        metadata: `${BUSINESS_NAME} — verification: verified.`,
      },
      {
        userId: adminUser.id,
        action: "walkthrough_demo.staff_overview",
        metadata: "Demo venue staff + primary employee@caretip.de account linked for multi-role tour.",
      },
    ],
  });

  console.log("");
  console.log("── Walkthrough demo (product tour) ──");
  console.log(`  Manager:  ${WALKTHROUGH_DEMO_MANAGER_EMAIL} / ${WALKTHROUGH_DEMO_MANAGER_PASSWORD}`);
  console.log(`  Employee: ${WALKTHROUGH_DEMO_EMPLOYEE_EMAIL} / ${WALKTHROUGH_DEMO_MANAGER_PASSWORD}`);
  console.log(`  Admin:    ${WALKTHROUGH_DEMO_ADMIN_EMAIL} / ${WALKTHROUGH_DEMO_MANAGER_PASSWORD}`);
  console.log(`  Venue:    ${BUSINESS_NAME} (verified) — team QR /${slug}`);
  console.log(`  Staff:    ${STAFF.map((x) => x.name).join(", ")}, Mina Schmidt (primary demo employee login)`);
  console.log("  Tables:   Main + Garden (QR slugs seeded)");
  console.log(
    `  Tips:     ${tipAmounts.length + demoEmpExtraAmounts.length} successful transactions (includes employee@ row)`,
  );
  console.log("  (Other staff demo emails reuse the same password for optional sign-in tests.)");
}
