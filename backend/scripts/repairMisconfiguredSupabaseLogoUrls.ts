/**
 * Fixes businesses.logo_path URLs that used bucket "caretip official" (mis-set SUPABASE_STORAGE_BUCKET).
 *
 * Usage: npm run db:repair-logo-urls --prefix backend
 * Add --dry-run to preview without writing.
 */
import { PrismaClient } from "@prisma/client";
import { normalizeSupabasePublicStorageUrl } from "../src/utils/normalizeSupabaseStorageUrl.js";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

async function main() {
  let updated = 0;

  const businesses = await prisma.business.findMany({
    where: { logoPath: { not: null } },
    select: { id: true, name: true, logoPath: true },
  });

  for (const row of businesses) {
    const raw = row.logoPath?.trim();
    if (!raw) continue;
    const fixed = normalizeSupabasePublicStorageUrl(raw);
    if (fixed === raw) continue;
    console.log(`[repair] business ${row.name} (${row.id})`);
    console.log(`  from: ${raw}`);
    console.log(`  to:   ${fixed}`);
    if (!dryRun) {
      await prisma.business.update({ where: { id: row.id }, data: { logoPath: fixed } });
    }
    updated += 1;
  }

  const employees = await prisma.employee.findMany({
    where: { avatar: { not: null } },
    select: { id: true, name: true, avatar: true },
  });

  for (const row of employees) {
    const raw = row.avatar?.trim();
    if (!raw) continue;
    const fixed = normalizeSupabasePublicStorageUrl(raw);
    if (fixed === raw) continue;
    console.log(`[repair] employee ${row.name ?? row.id} (${row.id})`);
    console.log(`  from: ${raw}`);
    console.log(`  to:   ${fixed}`);
    if (!dryRun) {
      await prisma.employee.update({ where: { id: row.id }, data: { avatar: fixed } });
    }
    updated += 1;
  }

  console.log(
    dryRun
      ? `[repair] dry-run: ${updated} row(s) would be updated`
      : `[repair] updated ${updated} row(s)`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
