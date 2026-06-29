import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";
import { getStripeClient } from "../src/services/stripe.service.js";

async function main() {
  const events = await prisma.subscriptionEvent.findMany({
    where: {
      auditType: "checkout_session_completed",
      processingResult: "ignored",
    },
    orderBy: { occurredAt: "desc" },
    take: 3,
    select: { stripeEventId: true, occurredAt: true, payload: true },
  });

  const stripe = getStripeClient();
  for (const e of events) {
    if (!e.stripeEventId) continue;
    const ev = await stripe.events.retrieve(e.stripeEventId);
    const session = ev.data.object as {
      id: string;
      subscription: string | null;
      metadata: Record<string, string>;
      mode: string;
    };
    console.log("---", e.occurredAt.toISOString(), e.stripeEventId, "---");
    console.log("event.type:", ev.type);
    console.log("session.id:", session.id);
    console.log("session.subscription (raw webhook payload):", session.subscription);
    console.log("session.metadata:", JSON.stringify(session.metadata));
    console.log("payload in DB:", JSON.stringify(e.payload));
    console.log("");
  }

  const updated = await prisma.subscriptionEvent.findFirst({
    where: {
      auditType: "stripe_subscription_updated",
      processingResult: "ignored",
    },
    orderBy: { occurredAt: "desc" },
  });
  if (updated?.stripeEventId) {
    const ev = await stripe.events.retrieve(updated.stripeEventId);
    const sub = ev.data.object as {
      id: string;
      status: string;
      metadata: Record<string, string>;
    };
    console.log("--- latest ignored subscription_updated ---");
    console.log("sub.id:", sub.id);
    console.log("sub.status:", sub.status);
    console.log("sub.metadata:", JSON.stringify(sub.metadata));
  }
}

main().finally(() => prisma.$disconnect());
