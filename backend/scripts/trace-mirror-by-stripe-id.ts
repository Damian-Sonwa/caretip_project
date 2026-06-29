import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";

async function main() {
  const subs = [
    "sub_1Tmacb66w930Tx0ADN3laPTd",
    "sub_1TmaXt66w930Tx0A0WcwGEMc",
    "sub_1TmakZ66w930Tx0A3gTmkMXG",
  ];
  for (const id of subs) {
    const row = await prisma.subscription.findFirst({
      where: { stripeSubscriptionId: id },
      select: { id: true, businessId: true, status: true },
    });
    console.log(id, row ?? "no mirror row");
  }

  const all = await prisma.subscription.findMany({
    where: { stripeCustomerId: "cus_Um8ok29Vr3QyxM" },
    select: { id: true, businessId: true, stripeSubscriptionId: true, status: true },
  });
  console.log("subscriptions with customer cus_Um8ok29Vr3QyxM:", all);
}

main().finally(() => prisma.$disconnect());
