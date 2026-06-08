/**
 * Investigate checkout.session.completed around a UTC timestamp.
 * Usage: npx dotenv -e ../.env -e .env -- tsx scripts/investigateStripeWebhookAt.ts "2026-06-03T13:53:00Z"
 */
import Stripe from "stripe";
import { PrismaClient } from "@prisma/client";
import "../src/loadEnv.js";

const prisma = new PrismaClient();
const when = process.argv[2] ?? "2026-06-03T13:53:00Z";
const center = new Date(when);
const windowStart = new Date(center.getTime() - 15 * 60_000);
const windowEnd = new Date(center.getTime() + 15 * 60_000);

function dbProjectRef(): { host: string | null; ref: string | null } {
  const raw = process.env.DATABASE_URL ?? "";
  const host = raw.match(/@([^:/]+)/)?.[1] ?? null;
  const ref = raw.match(/\/\/postgres\.([^:]+):/i)?.[1] ?? null;
  return { host, ref };
}

function supabaseRefs(): string[] {
  const refs = new Set<string>();
  for (const key of ["SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"]) {
    const m = process.env[key]?.match(/https?:\/\/([a-z0-9]+)\.supabase\.co/i);
    if (m?.[1]) refs.add(m[1]);
  }
  const jwt = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (jwt) {
    try {
      const p = JSON.parse(Buffer.from(jwt.split(".")[1]!, "base64url").toString("utf8")) as { ref?: string };
      if (p.ref) refs.add(p.ref);
    } catch {
      /* ignore */
    }
  }
  return [...refs];
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    console.error("STRIPE_SECRET_KEY missing");
    process.exit(1);
  }

  const stripe = new Stripe(key);
  const { host, ref } = dbProjectRef();

  console.log("=== Connected DB (from local .env DATABASE_URL) ===");
  console.log(JSON.stringify({ host, poolerProjectRef: ref, supabaseRefs: supabaseRefs() }, null, 2));

  console.log("\n=== Stripe events checkout.session.completed ±15m ===");
  console.log({ windowStart: windowStart.toISOString(), windowEnd: windowEnd.toISOString() });

  const events = await stripe.events.list({
    type: "checkout.session.completed",
    created: {
      gte: Math.floor(windowStart.getTime() / 1000),
      lte: Math.floor(windowEnd.getTime() / 1000),
    },
    limit: 20,
  });

  if (events.data.length === 0) {
    console.log("(no checkout.session.completed events in window — try different date or live vs test mode)");
  }

  for (const ev of events.data) {
    const session = ev.data.object as Stripe.Checkout.Session;
    const md = session.metadata ?? {};
    const pi = session.payment_intent;
    const paymentIntentId = typeof pi === "string" ? pi : pi?.id ?? null;
    const employeeId = md.employeeId ?? null;
    const businessId = md.businessId ?? null;

    console.log("\n--- event ---");
    console.log(
      JSON.stringify(
        {
          eventId: ev.id,
          created: new Date(ev.created * 1000).toISOString(),
          sessionId: session.id,
          paymentIntentId,
          employeeId,
          businessId,
          payment_status: session.payment_status,
          amount_total: session.amount_total,
          metadata: md,
        },
        null,
        2,
      ),
    );

    const [emp, biz, tip] = await Promise.all([
      employeeId ? prisma.employee.findUnique({ where: { id: employeeId }, select: { id: true, businessId: true } }) : null,
      businessId ? prisma.business.findUnique({ where: { id: businessId }, select: { id: true, name: true } }) : null,
      paymentIntentId
        ? prisma.transaction.findFirst({
            where: { stripePaymentIntentId: paymentIntentId },
            select: { id: true, createdAt: true, status: true },
          })
        : null,
    ]);

    console.log("DB lookup:");
    console.log(JSON.stringify({ employee: emp, business: biz, tip }, null, 2));

    if (employeeId && !emp) console.log(">>> employeeId NOT FOUND in connected DB");
    if (businessId && !biz) console.log(">>> businessId NOT FOUND in connected DB");
    if (emp && businessId && emp.businessId !== businessId) {
      console.log(">>> employee.businessId !== metadata.businessId (would not throw but wrong venue)");
    }
  }

  console.log("\n=== tips created in same window ===");
  const tips = await prisma.transaction.findMany({
    where: { createdAt: { gte: windowStart, lte: windowEnd } },
    select: {
      id: true,
      createdAt: true,
      stripePaymentIntentId: true,
      employeeId: true,
      businessId: true,
      amount: true,
    },
    orderBy: { createdAt: "asc" },
  });
  console.log(JSON.stringify(tips, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
