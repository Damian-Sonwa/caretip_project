/**
 * Reproduce handleSuccessfulTipPayment insert for a checkout session id.
 * npx dotenv -e ../.env -e .env -- tsx scripts/reproduceWebhookInsert.ts cs_test_...
 */
import Stripe from "stripe";
import { PrismaClient, Prisma } from "@prisma/client";
import "../src/loadEnv.js";

const prisma = new PrismaClient();
const sessionId = process.argv[2];
if (!sessionId) {
  console.error("Usage: tsx scripts/reproduceWebhookInsert.ts <checkout_session_id>");
  process.exit(1);
}

async function main() {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim());
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const md = session.metadata ?? {};
  const pi = session.payment_intent;
  const piId = typeof pi === "string" ? pi : pi?.id ?? null;
  const confirmedEur = session.amount_total != null ? session.amount_total / 100 : null;

  const payload = {
    amount: confirmedEur!,
    status: "success" as const,
    stripePaymentIntentId: piId!,
    employeeId: md.employeeId!,
    businessId: md.businessId!,
    locationId: null as string | null,
    tableId: null as string | null,
  };

  console.log("ATTEMPTING TIP INSERT", payload);

  try {
    const tip = await prisma.transaction.create({ data: payload });
    console.log("TIP CREATED", tip.id);
  } catch (err) {
    console.error("TIP INSERT FAILED RAW:");
    console.error(err);
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma code:", err.code);
      console.error("Meta:", err.meta);
    }
    if (err instanceof Error && err.stack) console.error(err.stack);
  }
}

main().finally(() => prisma.$disconnect());
