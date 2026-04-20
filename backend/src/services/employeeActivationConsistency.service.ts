import { prisma } from "../prisma.js";

/**
 * Fixes rows where `employees.activation_status = active` but the linked `User.email_verified` is still false.
 * Safe to run multiple times (idempotent for this invariant). Does not delete rows.
 */
export async function syncUsersVerifiedForActiveEmployees(): Promise<number> {
  const r = await prisma.user.updateMany({
    where: {
      emailVerified: false,
      employee: {
        is: { activationStatus: "active" },
      },
    },
    data: { emailVerified: true },
  });
  return r.count;
}

/** Logs when invariant is still violated (should be zero after repair flows). */
export async function logActiveEmployeeEmailMismatch(): Promise<number> {
  const bad = await prisma.employee.count({
    where: {
      activationStatus: "active",
      user: { is: { emailVerified: false } },
    },
  });
  if (bad > 0) {
    console.warn(
      "[employee-invariant] active employees with unverified user rows:",
      bad,
      "(run syncUsersVerifiedForActiveEmployees or inspect data)",
    );
  }
  return bad;
}
