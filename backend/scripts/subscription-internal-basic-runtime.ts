/**
 * Commit 1 — internal Basic entitlement foundation runtime checks.
 * Run: npm run test:subscription-internal-basic
 */
import "dotenv/config";
import "../src/loadEnv.js";
import bcrypt from "bcrypt";
import { SubscriptionStatus } from "@prisma/client";
import { prisma } from "../src/prisma.js";
import { registerBusiness } from "../src/services/auth.service.js";
import { getBusinessByUserId } from "../src/services/business.service.js";
import { resolveSubscriptionEntitlements } from "../src/services/subscriptionEntitlement.service.js";
import { SUBSCRIPTION_AUDIT_TYPES } from "../src/lib/subscription/subscriptionAuditTypes.js";
import {
  downgradeToInternalBasic,
  isInternalBasicSubscription,
  provisionInternalBasicSubscription,
} from "../src/services/subscription.service.js";
import { isSubscriptionMirrorEntitled } from "../src/lib/subscription/subscriptionMirrorEntitlement.js";

const results: string[] = [];
const pass = (m: string) => results.push(`PASS: ${m}`);
const fail = (m: string) => results.push(`FAIL: ${m}`);

async function assertInternalBasicEntitlements(businessId: string, label: string): Promise<boolean> {
  const sub = await prisma.subscription.findUnique({
    where: { businessId },
    select: {
      planKey: true,
      status: true,
      stripeSubscriptionId: true,
      stripePriceId: true,
      isTrial: true,
    },
  });

  if (!sub) {
    fail(`${label}: subscription missing`);
    return false;
  }

  if (!isInternalBasicSubscription(sub)) {
    fail(`${label}: not internal Basic mirror`);
    return false;
  }

  if (sub.stripePriceId != null) {
    fail(`${label}: stripePriceId should be null`);
    return false;
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { subscriptionTier: true },
  });

  if (business?.subscriptionTier !== "basic") {
    fail(`${label}: business.subscriptionTier should be basic`);
    return false;
  }

  const entitlements = await resolveSubscriptionEntitlements(businessId);
  if (!entitlements.hasActiveEntitlements) {
    fail(`${label}: hasActiveEntitlements should be true`);
    return false;
  }
  if (entitlements.accessSource !== "subscription") {
    fail(`${label}: accessSource should be subscription, got ${entitlements.accessSource}`);
    return false;
  }
  if (entitlements.plan !== "basic") {
    fail(`${label}: plan should be basic`);
    return false;
  }

  pass(`${label}: internal Basic entitled`);
  return true;
}

async function testSignupProvisioning(): Promise<boolean> {
  const tag = `c1-signup-${Date.now()}`;
  const result = await registerBusiness({
    email: `${tag}@caretip-test.local`,
    password: "TestPass1!",
  });
  const businessId = result.user.businessId;
  if (!businessId) {
    fail("signup: no businessId");
    return false;
  }

  const event = await prisma.subscriptionEvent.findFirst({
    where: {
      subscription: { businessId },
      auditType: SUBSCRIPTION_AUDIT_TYPES.created,
    },
    select: { payload: true },
  });
  const source =
    event?.payload && typeof event.payload === "object" && event.payload !== null
      ? (event.payload as Record<string, unknown>).source
      : null;
  if (source !== "email_signup") {
    fail(`signup: expected audit source email_signup, got ${String(source)}`);
    return false;
  }

  return assertInternalBasicEntitlements(businessId, "email signup");
}

async function testProvisionIdempotent(): Promise<boolean> {
  const tag = `c1-idem-${Date.now()}`;
  const passwordHash = await bcrypt.hash("TestPass1!", 10);
  const user = await prisma.user.create({
    data: {
      email: `${tag}@caretip-test.local`,
      passwordHash,
      role: "MANAGER",
      emailVerified: true,
      business: {
        create: {
          name: `${tag} venue`,
          slug: `${tag}-venue`,
        },
      },
    },
    include: { business: true },
  });

  if (!user.business) {
    fail("idempotent: business missing");
    return false;
  }

  const first = await provisionInternalBasicSubscription(user.business.id, {
    source: "auto_heal",
  });
  const second = await provisionInternalBasicSubscription(user.business.id, {
    source: "auto_heal",
  });

  if (!first.created) {
    fail("idempotent: first call should create");
    return false;
  }
  if (!second.skipped) {
    fail("idempotent: second call should skip");
    return false;
  }

  pass("provisionInternalBasicSubscription idempotent");
  return assertInternalBasicEntitlements(user.business.id, "idempotent provision");
}

async function testAutoHeal(): Promise<boolean> {
  const tag = `c1-heal-${Date.now()}`;
  const passwordHash = await bcrypt.hash("TestPass1!", 10);
  const user = await prisma.user.create({
    data: {
      email: `${tag}@caretip-test.local`,
      passwordHash,
      role: "MANAGER",
      emailVerified: true,
    },
  });

  const business = await getBusinessByUserId(user.id);
  if (!business) {
    fail("auto-heal: business not created");
    return false;
  }

  return assertInternalBasicEntitlements(business.id, "auto-heal");
}

async function testDowngradePreservesBusiness(): Promise<boolean> {
  const tag = `c1-downgrade-${Date.now()}`;
  const passwordHash = await bcrypt.hash("TestPass1!", 10);
  const user = await prisma.user.create({
    data: {
      email: `${tag}@caretip-test.local`,
      passwordHash,
      role: "MANAGER",
      emailVerified: true,
      business: {
        create: {
          name: `${tag} venue`,
          slug: `${tag}-venue`,
          subscriptionTier: "premium",
          subscription: {
            create: {
              planKey: "premium",
              status: SubscriptionStatus.canceled,
              billingCycle: "monthly",
              stripeSubscriptionId: `sub_test_${tag}`,
              stripePriceId: "price_test",
              canceledAt: new Date(Date.now() - 86_400_000),
            },
          },
        },
      },
    },
    include: { business: { include: { subscription: true } } },
  });

  const business = user.business;
  if (!business?.subscription) {
    fail("downgrade: setup failed");
    return false;
  }

  await downgradeToInternalBasic({
    subscriptionRowId: business.subscription.id,
    businessId: business.id,
    reason: "test_downgrade",
  });

  const stillThere = await prisma.business.findUnique({ where: { id: business.id } });
  if (!stillThere) {
    fail("downgrade: business deleted");
    return false;
  }

  const updatedSub = await prisma.subscription.findUnique({
    where: { businessId: business.id },
    select: {
      planKey: true,
      status: true,
      stripeSubscriptionId: true,
      cancelAtPeriodEnd: true,
      canceledAt: true,
    },
  });

  if (!updatedSub) {
    fail("downgrade: subscription row deleted");
    return false;
  }

  if (updatedSub.stripeSubscriptionId != null) {
    fail("downgrade: stripeSubscriptionId not cleared");
    return false;
  }

  if (!isSubscriptionMirrorEntitled(updatedSub)) {
    fail("downgrade: mirror not entitled after downgrade");
    return false;
  }

  pass("downgradeToInternalBasic keeps business + subscription row");
  return assertInternalBasicEntitlements(business.id, "post-downgrade");
}

async function main() {
  let ok = true;
  ok = (await testSignupProvisioning()) && ok;
  ok = (await testProvisionIdempotent()) && ok;
  ok = (await testAutoHeal()) && ok;
  ok = (await testDowngradePreservesBusiness()) && ok;

  console.log("Commit 1 — internal Basic entitlement runtime checks\n");
  for (const line of results) {
    console.log(line);
  }

  if (!ok) {
    process.exitCode = 1;
    console.log("\nRESULT: FAIL");
    return;
  }
  console.log("\nRESULT: PASS");
}

void main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
