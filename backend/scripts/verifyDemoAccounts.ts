import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";
import { login } from "../src/services/auth.service.js";

const ACCOUNTS = [
  { email: "demo@caretip.de", role: "MANAGER" as const },
  { email: "employee@caretip.de", role: "EMPLOYEE" as const },
  { email: "admin@caretip.de", role: "SUPER_ADMIN" as const },
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
      await login({ email: a.email, password: "Demo1234!", intendedRole: a.role });
      auth = "OK";
    } catch (e) {
      auth = e instanceof Error ? e.message : "fail";
    }
    console.log(
      JSON.stringify({
        email: a.email,
        userId: user.id,
        role: user.role,
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
