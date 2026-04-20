/**
 * Backfill slug for existing employees without one.
 * Run: npx tsx prisma/backfill-slugs.ts
 */
import "dotenv/config";
import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";
import { generateSlug, ensureUniqueSlug } from "../src/utils/slug.js";

async function main() {
  const employees = await prisma.employee.findMany({
    where: { slug: null },
    select: { id: true, name: true },
  });
  if (employees.length === 0) {
    console.log("No employees to backfill.");
    return;
  }
  for (const emp of employees) {
    const baseSlug = generateSlug(emp.name);
    const slug = await ensureUniqueSlug(baseSlug, async (s) => {
      const existing = await prisma.employee.findFirst({
        where: { slug: s },
      });
      return !!existing;
    });
    await prisma.employee.update({
      where: { id: emp.id },
      data: { slug },
    });
    console.log(`Updated ${emp.name} -> ${slug}`);
  }
  console.log(`Backfilled ${employees.length} employee(s).`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
