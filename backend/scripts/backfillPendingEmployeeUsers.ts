/**
 * One-time: link `employees.user_id` for legacy rows created before activation-flow
 * always created a User (pending rows had `user_id` null).
 *
 * Uses raw SQL to find `user_id IS NULL` rows because the Prisma schema may already
 * mark `userId` as required (so `where: { userId: null }` is rejected by the client).
 *
 * Run from repo root:
 *   npm --prefix backend run db:backfill-pending-employee-users
 *
 * Run before (or on a DB that still allows) NULL `employees.user_id`, then apply the
 * NOT NULL migration if you have not already.
 */
import "dotenv/config";
import { Prisma } from "@prisma/client";
import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";

function normalizeEmail(raw: string): string {
  return String(raw ?? "").trim().toLowerCase();
}

async function main() {
  const rows = await prisma.$queryRaw<Array<{ id: string; email: string | null }>>(
    Prisma.sql`
      SELECT e.id, sub.email AS email
      FROM employees e
      LEFT JOIN LATERAL (
        SELECT t.email
        FROM employee_activation_tokens t
        WHERE t.employee_id = e.id
        ORDER BY t.created_at DESC
        LIMIT 1
      ) sub ON true
      WHERE e.activation_status = 'pending_activation'
        AND e.user_id IS NULL
    `,
  );

  let created = 0;
  let skipped = 0;

  for (const e of rows) {
    const raw = e.email;
    if (!raw) {
      console.warn("[backfillPendingEmployeeUsers] skip employee (no token email)", e.id);
      skipped += 1;
      continue;
    }
    const email = normalizeEmail(raw);
    const taken = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true } });
    if (taken) {
      console.warn(
        "[backfillPendingEmployeeUsers] skip employee (email already in users)",
        e.id,
        email,
      );
      skipped += 1;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: null,
          role: "EMPLOYEE",
          isPlatformAdmin: false,
          emailVerified: false,
        },
      });
      await tx.employee.update({
        where: { id: e.id },
        data: { userId: user.id },
      });
    });
    created += 1;
  }

  console.info("[backfillPendingEmployeeUsers] done", {
    scanned: rows.length,
    usersCreatedAndLinked: created,
    skipped,
  });
}

main()
  .catch((err) => {
    console.error("[backfillPendingEmployeeUsers] failed", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
