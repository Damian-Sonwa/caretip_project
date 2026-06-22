import "dotenv/config";
import bcrypt from "bcrypt";
import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";
import { seedWalkthroughDemo } from "./seedWalkthroughDemo.js";

async function main() {
  const defaultPassword = "password123";
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  await prisma.user.upsert({
    where: { email: "platform@caretip-demo.com" },
    update: { isPlatformAdmin: true, role: "SUPER_ADMIN", isActive: true },
    create: {
      email: "platform@caretip-demo.com",
      passwordHash,
      role: "SUPER_ADMIN",
      isPlatformAdmin: true,
      isActive: true,
    },
  });

  // Create business user
  const businessUser = await prisma.user.upsert({
    where: { email: "owner@caretip-demo.com" },
    update: { role: "MANAGER", isPlatformAdmin: false, isActive: true },
    create: {
      email: "owner@caretip-demo.com",
      passwordHash,
      role: "MANAGER",
      isPlatformAdmin: false,
      isActive: true,
    },
  });

  // Create business (slug required for directory / pooler queries)
  const business = await prisma.business.upsert({
    where: { id: "seed-business-001" },
    update: {
      slug: "the-rustic-table",
      verificationStatus: "verified",
    },
    create: {
      id: "seed-business-001",
      name: "The Rustic Table",
      slug: "the-rustic-table",
      inviteCode: "DEMO42",
      verificationStatus: "verified",
      userId: businessUser.id,
      subscriptionTier: "premium",
    },
  });

  // Create employee users and employees
  const employeeData = [
    { name: "Sarah Chen", jobTitle: "Server", email: "sarah@caretip-demo.com", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face" },
    { name: "Marcus Johnson", jobTitle: "Bartender", email: "marcus@caretip-demo.com", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face" },
    { name: "Elena Rodriguez", jobTitle: "Host", email: "elena@caretip-demo.com", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face" },
  ];

  const employees = [];
  for (const emp of employeeData) {
    const user = await prisma.user.upsert({
      where: { email: emp.email },
      update: { role: "EMPLOYEE", isPlatformAdmin: false, isActive: true },
      create: {
        email: emp.email,
        passwordHash,
        role: "EMPLOYEE",
        isPlatformAdmin: false,
        isActive: true,
      },
    });

    const employee = await prisma.employee.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        name: emp.name,
        jobTitle: emp.jobTitle,
        avatar: emp.avatar,
        businessId: business.id,
        userId: user.id,
      },
    });
    employees.push(employee);
  }

  // Create sample tips
  const tipAmounts = [5.0, 10.0, 15.0, 20.0, 8.5, 12.0];
  for (let i = 0; i < 6; i++) {
    const employee = employees[i % employees.length];
    await prisma.transaction.upsert({
      where: {
        id: `seed-tip-00${i + 1}`,
      },
      update: {
        payoutStatus: i < 4 ? "pending" : "not_applicable",
      },
      create: {
        id: `seed-tip-00${i + 1}`,
        amount: tipAmounts[i],
        status: i < 4 ? "success" : "pending",
        payoutStatus: i < 4 ? "pending" : "not_applicable",
        employeeId: employee.id,
        businessId: business.id,
      },
    });
  }

  console.log("Seed completed successfully");
  console.log("- Platform admin: platform@caretip-demo.com / password123");
  console.log("- Business:", business.name, "(owner@caretip-demo.com / password123)");
  console.log("- Invite code:", business.inviteCode);
  console.log("- Employees:", employeeData.map((e) => `${e.name} (${e.email})`).join(", "));
  console.log("- All demo passwords: password123");

  await seedWalkthroughDemo(prisma);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
