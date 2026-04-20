/**
 * One-off / ops: add N employees for a manager's business using the same path as dashboard
 * "add without activation" — email verified, active, temp password (see employee.service TEMP_PASSWORD).
 *
 * Usage (from repo root or backend):
 *   npx dotenv -e ../.env -e .env -- npx tsx scripts/addBypassEmployeesForManager.ts
 */
import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";
import { createEmployee } from "../src/services/employee.service.js";

const MANAGER_EMAIL = "madudamian25@gmail.com".toLowerCase();

const STAFF = [
  { name: "Roster Staff One", jobTitle: "Server", email: "madudamian25+roster1@gmail.com" },
  { name: "Roster Staff Two", jobTitle: "Server", email: "madudamian25+roster2@gmail.com" },
  { name: "Roster Staff Three", jobTitle: "Host", email: "madudamian25+roster3@gmail.com" },
] as const;

async function main() {
  const manager = await prisma.user.findUnique({
    where: { email: MANAGER_EMAIL },
    select: { id: true, email: true, role: true, business: { select: { id: true } } },
  });
  if (!manager) {
    throw new Error(`No user found with email ${MANAGER_EMAIL}`);
  }
  if (manager.role !== "MANAGER" || !manager.business) {
    throw new Error(`User ${MANAGER_EMAIL} is not a manager with a business`);
  }
  const businessId = manager.business.id;
  const out: { email: string; password: string; name: string }[] = [];
  for (const row of STAFF) {
    try {
      const created = await createEmployee({
        name: row.name,
        jobTitle: row.jobTitle,
        email: row.email,
        businessId,
        locationId: null,
        tableIds: [],
      });
      out.push({
        email: row.email,
        password: created.temporaryPassword ?? "Welcome1!",
        name: created.name,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("Email already registered")) {
        console.warn(`[skip] ${row.email} already exists`);
        continue;
      }
      throw e;
    }
  }
  console.log(JSON.stringify({ businessId, managerEmail: MANAGER_EMAIL, employees: out }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect().catch(() => undefined));
