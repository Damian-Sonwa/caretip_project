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
    monthlyGoal: 650,
  },
  {
    email: "sam.staff.demo@caretip.de",
    name: "Sam Winters",
    jobTitle: "Bartender",
    slug: "wd-brasserie-sam",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    monthlyGoal: 500,
  },
  {
    email: "jordan.staff.demo@caretip.de",
    name: "Jordan Park",
    jobTitle: "Host",
    slug: "wd-brasserie-jordan",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    monthlyGoal: 420,
  },
] as const;

function staggeredTipDate(daysAgo: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(12 + (daysAgo % 5), 10 + (daysAgo % 40), 0, 0);
  return d;
}

/** Tips within the last hour so operational pulse shows live activity on demo dashboards. */
function recentTipDate(minutesAgo: number): Date {
  const d = new Date();
  d.setMinutes(d.getMinutes() - minutesAgo);
  return d;
}

async function ensureActiveEmployeeGoal(
  prisma: PrismaClient,
  employeeId: string,
  goal: { goalAmount: number; goalPeriod: "monthly"; startDate: Date },
): Promise<void> {
  const existing = await prisma.employeeGoal.findFirst({
    where: { employeeId },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });
  if (existing) {
    await prisma.employeeGoal.update({
      where: { id: existing.id },
      data: {
        goalAmount: goal.goalAmount,
        goalPeriod: goal.goalPeriod,
        startDate: goal.startDate,
        status: "active",
      },
    });
    return;
  }
  await prisma.employeeGoal.create({
    data: {
      employeeId,
      goalAmount: goal.goalAmount,
      goalPeriod: goal.goalPeriod,
      startDate: goal.startDate,
      status: "active",
    },
  });
}

async function seedDemoInboxNotifications(
  prisma: PrismaClient,
  users: { managerId: string; employeeUserId: string | null },
): Promise<void> {
  const rows: Array<{
    userId: string;
    type: string;
    title: string;
    message: string;
    dedupeKey: string;
    metadata: Record<string, unknown>;
    channels: string[];
  }> = [
    {
      userId: users.managerId,
      type: "demo_welcome",
      title: "Welcome to CareTip",
      message: "Your walkthrough venue is live. Open the dashboard to review tips, staff, and goals.",
      dedupeKey: "walkthrough:manager:welcome",
      metadata: { url: "/dashboard" },
      channels: ["in_app"],
    },
    {
      userId: users.managerId,
      type: "demo_tips",
      title: "Tips are flowing in",
      message: "Seeded demo tips are available across week, month, and year views.",
      dedupeKey: "walkthrough:manager:tips",
      metadata: { url: "/dashboard" },
      channels: ["in_app"],
    },
  ];
  if (users.employeeUserId) {
    rows.push({
      userId: users.employeeUserId,
      type: "demo_welcome",
      title: "Your tip dashboard is ready",
      message: "Track earnings, goals, and recent tips from your employee dashboard.",
      dedupeKey: "walkthrough:employee:welcome",
      metadata: { url: "/employee/dashboard" },
      channels: ["in_app"],
    });
  }
  for (const row of rows) {
    await prisma.notification.upsert({
      where: { userId_dedupeKey: { userId: row.userId, dedupeKey: row.dedupeKey } },
      update: {
        title: row.title,
        message: row.message,
        metadata: row.metadata,
        channels: row.channels,
        readAt: null,
      },
      create: {
        userId: row.userId,
        type: row.type,
        title: row.title,
        message: row.message,
        metadata: row.metadata,
        channels: row.channels,
        dedupeKey: row.dedupeKey,
      },
    });
  }
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
      inviteCode: "WDEM42",
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
      inviteCode: "WDEM42",
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
        monthlyGoal: s.monthlyGoal,
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
        monthlyGoal: s.monthlyGoal,
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
      monthlyGoal: 650,
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
      monthlyGoal: 650,
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
    const e2 = employeeRows[2];
    if (e2) {
      await prisma.employeeTableAssignment.upsert({
        where: { employeeId_tableId: { employeeId: e2.id, tableId: tableMain.id } },
        update: { employeeName: STAFF[2].name },
        create: {
          employeeId: e2.id,
          tableId: tableMain.id,
          employeeName: STAFF[2].name,
        },
      });
    }
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
        createdAt: staggeredTipDate(i % 45),
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
        createdAt: staggeredTipDate(i % 45),
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
        createdAt: staggeredTipDate((j + 3) % 45),
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
        createdAt: staggeredTipDate((j + 3) % 45),
      },
    });
  }

  const recentPulseTips = [
    { id: "wdemotip033", amount: 12, employeeId: demoPrimaryEmployee.id, minutesAgo: 42 },
    { id: "wdemotip034", amount: 18.5, employeeId: employeeRows[0]?.id ?? demoPrimaryEmployee.id, minutesAgo: 18 },
    { id: "wdemotip035", amount: 9, employeeId: employeeRows[1]?.id ?? demoPrimaryEmployee.id, minutesAgo: 5 },
  ] as const;
  for (const tip of recentPulseTips) {
    await prisma.transaction.upsert({
      where: { id: tip.id },
      update: {
        amount: tip.amount,
        status: "success",
        payoutStatus: "pending",
        employeeId: tip.employeeId,
        businessId: business.id,
        locationId: locMain.id,
        tableId: tableMain.id,
        createdAt: recentTipDate(tip.minutesAgo),
      },
      create: {
        id: tip.id,
        amount: tip.amount,
        status: "success",
        payoutStatus: "pending",
        employeeId: tip.employeeId,
        businessId: business.id,
        locationId: locMain.id,
        tableId: tableMain.id,
        createdAt: recentTipDate(tip.minutesAgo),
      },
    });
  }

  const now = new Date();
  const goalMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 12, 0, 0, 0));

  const goalByStaffIndex = [STAFF[0].monthlyGoal, STAFF[1].monthlyGoal, STAFF[2].monthlyGoal] as const;
  for (let i = 0; i < employeeRows.length; i++) {
    const row = employeeRows[i];
    const amount = goalByStaffIndex[i];
    if (!row || amount == null) continue;
    await ensureActiveEmployeeGoal(prisma, row.id, {
      goalAmount: amount,
      goalPeriod: "monthly",
      startDate: goalMonthStart,
    });
  }

  await ensureActiveEmployeeGoal(prisma, demoPrimaryEmployee.id, {
    goalAmount: 650,
    goalPeriod: "monthly",
    startDate: goalMonthStart,
  });

  const employeeUser = await prisma.user.findFirst({
    where: { email: WALKTHROUGH_DEMO_EMPLOYEE_EMAIL },
    select: { id: true },
  });
  await seedDemoInboxNotifications(prisma, {
    managerId: manager.id,
    employeeUserId: employeeUser?.id ?? null,
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
    `  Tips:     ${tipAmounts.length + demoEmpExtraAmounts.length + recentPulseTips.length} successful transactions (includes employee@ row + live pulse)`,
  );
  console.log("  Goals:    Active monthly goals for all staff (aligned with monthlyGoal targets)");
  console.log("  (Other staff demo emails reuse the same password for optional sign-in tests.)");
}
