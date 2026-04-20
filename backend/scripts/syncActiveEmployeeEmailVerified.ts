/**
 * One-time / maintenance: set `users.email_verified = true` for any user linked to an
 * `employees.activation_status = active` row where email_verified is still false.
 *
 * From `backend/`:
 *   npm run db:sync-active-employee-email-verified
 */
import "dotenv/config";
import "../src/loadEnv.js";
import {
  logActiveEmployeeEmailMismatch,
  syncUsersVerifiedForActiveEmployees,
} from "../src/services/employeeActivationConsistency.service.js";

async function main() {
  const updated = await syncUsersVerifiedForActiveEmployees();
  console.info("[syncActiveEmployeeEmailVerified] users updated:", updated);
  const remaining = await logActiveEmployeeEmailMismatch();
  if (remaining === 0) {
    console.info("[syncActiveEmployeeEmailVerified] invariant OK (no active/unverified pairs)");
  }
}

main()
  .catch((e) => {
    console.error("[syncActiveEmployeeEmailVerified] failed", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("../src/prisma.js");
    await prisma.$disconnect().catch(() => undefined);
  });
