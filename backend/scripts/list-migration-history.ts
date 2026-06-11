import "dotenv/config";
import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";

async function main() {
  const rows = await prisma.$queryRaw<
    Array<{ migration_name: string; finished_at: Date | null; applied_steps_count: number }>
  >`
    SELECT migration_name, finished_at, applied_steps_count
    FROM "_prisma_migrations"
    ORDER BY finished_at DESC NULLS LAST
  `;
  const total = rows.length;
  console.log(`Total migrations in database: ${total}\n`);
  console.log("Latest 10 (newest first):");
  for (const r of rows.slice(0, 10)) {
    console.log(`  ${r.finished_at?.toISOString() ?? "pending"}  ${r.migration_name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
