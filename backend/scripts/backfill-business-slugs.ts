/**
 * Fills NULL/empty `businesses.slug` from business name.
 *
 * **Existing DBs** (rows before `slug` existed): Prisma cannot add a required column in one step.
 * 1. Keep `Business.slug` as `String?` in `schema.prisma` → **`npm run db:push`**
 * 2. **`npm run db:backfill-business-slugs`**
 * 3. Change `slug` to **`String` @unique** (required) in `schema.prisma` → **`npm run db:push`** again
 */
import "dotenv/config";
import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";
import { generateUniqueBusinessSlugForName } from "../src/services/business.service.js";

async function slugColumnExists(): Promise<boolean> {
  const rows = await prisma.$queryRawUnsafe<Array<{ exists: boolean }>>(
    `SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'businesses' AND column_name = 'slug'
    ) AS "exists"`
  );
  return rows[0]?.exists === true;
}

async function main() {
  if (!(await slugColumnExists())) {
    console.log(
      "Column `businesses.slug` does not exist yet. Run first:\n" +
        "  npm run db:push\n" +
        "Then run this script again only if you need to backfill empty slugs."
    );
    return;
  }

  const rows = await prisma.$queryRawUnsafe<Array<{ id: string; name: string }>>(
    `SELECT id, name FROM businesses WHERE slug IS NULL OR TRIM(slug) = ''`
  );
  if (rows.length === 0) {
    console.log("No businesses need slug backfill.");
    return;
  }
  for (const row of rows) {
    const slug = await generateUniqueBusinessSlugForName(row.name);
    await prisma.business.update({ where: { id: row.id }, data: { slug } });
    console.log(`Set slug for ${row.id}: ${slug}`);
  }
  console.log(`Backfill complete (${rows.length} row(s)).`);
}

void main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
