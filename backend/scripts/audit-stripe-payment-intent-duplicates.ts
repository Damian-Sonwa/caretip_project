/**
 * Pre-migration audit: lists duplicate stripe_payment_intent_id values on tips.
 * Usage: dotenv -e ../.env -e .env -- tsx scripts/audit-stripe-payment-intent-duplicates.ts
 */
import { prisma } from "../src/prisma.js";

async function main() {
  const rows = await prisma.$queryRaw<
    Array<{ stripe_payment_intent_id: string; cnt: bigint }>
  >`
    SELECT stripe_payment_intent_id, COUNT(*)::bigint AS cnt
    FROM tips
    WHERE stripe_payment_intent_id IS NOT NULL
    GROUP BY stripe_payment_intent_id
    HAVING COUNT(*) > 1
    ORDER BY cnt DESC
  `;

  if (rows.length === 0) {
    console.log("OK: no duplicate stripe_payment_intent_id values.");
    return;
  }

  console.error(`Found ${rows.length} duplicate payment intent id(s):`);
  for (const r of rows) {
    console.error(`  ${r.stripe_payment_intent_id} (${String(r.cnt)} rows)`);
  }
  process.exitCode = 1;
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => void prisma.$disconnect());
