import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";
import { login } from "../src/services/auth.service.js";
import { PLATFORM_ADMIN_TEAM } from "../prisma/seedPlatformAdminTeam.js";

const ACCOUNTS: Array<{ email: string; role: "MANAGER" | "EMPLOYEE" | "SUPER_ADMIN"; password: string }> = [
  { email: "demo@caretip.de", role: "MANAGER", password: "Demo1234!" },
  { email: "employee@caretip.de", role: "EMPLOYEE", password: "Demo1234!" },
  { email: "admin@caretip.de", role: "SUPER_ADMIN", password: "Demo1234!" },
  ...PLATFORM_ADMIN_TEAM.map((m) => ({
    email: m.email,
    role: "SUPER_ADMIN" as const,
    password: m.tempPassword,
  })),
];

async function main() {
  const raw = process.env.DATABASE_URL ?? "";
  const ref = raw.match(/postgres\.([^:]+)@/)?.[1];
  const host = raw.match(/@([^:/]+)/)?.[1];
  console.log(JSON.stringify({ host, database: "postgres", projectRef: ref }));

  for (const a of ACCOUNTS) {
    const user = await prisma.user.findUnique({
      where: { email: a.email },
      include: { business: { select: { id: true } }, employee: { select: { id: true, businessId: true } } },
    });
    if (!user) {
      console.log(a.email, "MISSING");
      continue;
    }
    let auth = "skip";
    try {
      await login({ email: a.email, password: a.password });
      auth = "OK";
    } catch (e) {
      auth = e instanceof Error ? e.message : "fail";
    }
    console.log(
      JSON.stringify({
        email: a.email,
        userId: user.id,
        role: user.role,
        isPlatformAdmin: user.isPlatformAdmin,
        twoFactorEnabled: user.twoFactorEnabled,
        isActive: user.isActive,
        emailVerified: user.emailVerified,
        businessId: user.business?.id ?? null,
        employeeId: user.employee?.id ?? null,
        auth,
      }),
    );
  }
}

main().finally(() => prisma.$disconnect());
