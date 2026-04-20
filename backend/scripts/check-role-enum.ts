/**
 * Verify public.Role enum labels match Prisma (EMPLOYEE, MANAGER, SUPER_ADMIN).
 * Run after `npm run db:migrate:deploy`.
 */
import "dotenv/config";
import "../src/loadEnv.js";
import { PrismaClient } from "@prisma/client";
import { getDatabaseUrlForPrisma } from "../src/databaseUrl.js";

const expected = ["EMPLOYEE", "MANAGER", "SUPER_ADMIN"];

async function main() {
  const prisma = new PrismaClient({
    datasources: { db: { url: getDatabaseUrlForPrisma() } },
  });
  try {
    const rows = await prisma.$queryRaw<{ enumlabel: string }[]>`
      SELECT e.enumlabel::text AS enumlabel
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      JOIN pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public' AND t.typname = 'Role'
      ORDER BY e.enumsortorder
    `;
    const labels = rows.map((r) => r.enumlabel);
    const exp = new Set(expected);
    const act = new Set(labels);
    const ok =
      exp.size === act.size && [...exp].every((v) => act.has(v));
    if (!ok) {
      console.error("Role enum mismatch.");
      console.error("  Expected:", [...exp].sort().join(", "));
      console.error("  Actual:  ", [...act].sort().join(", "));
      process.exit(1);
    }
    console.log("OK: Role enum matches Prisma:", [...act].sort().join(", "));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
