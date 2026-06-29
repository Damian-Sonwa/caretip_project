import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";

const subIds = [
  "sub_1Tmacb66w930Tx0ADN3laPTd",
  "sub_1TmaXt66w930Tx0A0WcwGEMc",
];

async function main() {
  const events = await prisma.subscriptionEvent.findMany({
    orderBy: { occurredAt: "desc" },
    take: 50,
    select: {
      auditType: true,
      processingResult: true,
      processingError: true,
      payload: true,
      occurredAt: true,
      stripeEventId: true,
    },
  });

  console.log("Events mentioning trial subs or business cmqv0eju4000ju790n3cy6uhp:");
  for (const e of events) {
    const raw = JSON.stringify(e.payload ?? {});
    if (
      subIds.some((id) => raw.includes(id)) ||
      raw.includes("cmqv0eju4000ju790n3cy6uhp") ||
      e.auditType.includes("checkout")
    ) {
      console.log(e.occurredAt.toISOString(), e.auditType, e.processingResult, e.processingError ?? "", raw);
    }
  }

  console.log("\nAll ignored events:");
  const ignored = await prisma.subscriptionEvent.findMany({
    where: { processingResult: "ignored" },
    orderBy: { occurredAt: "desc" },
    take: 20,
  });
  for (const e of ignored) {
    console.log(e.occurredAt.toISOString(), e.auditType, JSON.stringify(e.payload));
  }
}

main().finally(() => prisma.$disconnect());
