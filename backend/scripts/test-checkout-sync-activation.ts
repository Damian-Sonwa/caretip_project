import "../src/loadEnv.js";
import { getCheckoutSyncStatusForBusiness } from "../src/services/managerBilling.service.js";
import { resolveSubscriptionEntitlements } from "../src/services/subscriptionEntitlement.service.js";
import { getManagerBusinessProfileById } from "../src/services/business.service.js";
import { prisma } from "../src/prisma.js";

const businessId = process.argv[2] ?? "cmqv1z2880007u7a4ggyxvxj5";

async function main() {
  console.log("Testing checkout return sync for", businessId);
  const before = await prisma.subscription.findUnique({ where: { businessId } });
  console.log("mirror before:", before ? "exists" : "NONE");

  const sync = await getCheckoutSyncStatusForBusiness(businessId, undefined);
  console.log("sync-status:", sync);

  const after = await prisma.subscription.findUnique({
    where: { businessId },
    select: { planKey: true, status: true, stripeSubscriptionId: true },
  });
  console.log("mirror after:", after);

  const ent = await resolveSubscriptionEntitlements(businessId);
  console.log("entitlements:", ent);

  const profile = await getManagerBusinessProfileById(businessId);
  console.log("profile:", {
    subscriptionTier: profile?.subscriptionTier,
    subscriptionStatus: profile?.subscriptionStatus,
    plan: profile?.plan,
    hasActiveSubscription: profile?.hasActiveSubscription,
  });
}

main().finally(() => prisma.$disconnect());
