/**
 * Phase B.2.1 — Backend entitlement enforcement runtime checks.
 * Run: npm run test:subscription-b2
 */
import "dotenv/config";
import "../src/loadEnv.js";
import { BusinessSubscriptionTier } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../src/prisma.js";
import {
  businessTipsQueryRequiresAdvancedAnalytics,
  employeeTipsListQueryRequiresAdvancedAnalytics,
  type FeatureKey,
  type SubscriptionCapability,
  capabilitiesForTier,
  hasSubscriptionCapability,
} from "../src/config/subscriptionCapabilities.js";
import { buildNestedSubscriptionCreateData } from "../src/services/subscription.service.js";
import {
  getSubscriptionTierForBusinessId,
  hasFeature,
  hasFeatureForTier,
  maskEmployeeGoalsInResponse,
} from "../src/services/subscriptionEntitlement.service.js";
import { createLocationForBusinessUser } from "../src/services/locations.service.js";

const STARTER_FEATURES: SubscriptionCapability[] = [
  "employeeQr",
  "locationQr",
  "tableQr",
  "teamManagement",
  "customerFeedback",
  "tipManagement",
  "basicAnalytics",
  "csvExport",
];

const BUSINESS_ONLY_FEATURES: FeatureKey[] = [
  "qrTemplates",
  "advancedAnalytics",
  "multiLocation",
  "employeeGoals",
  "brandingCustomization",
];

const results: string[] = [];
const pass = (m: string) => results.push(`PASS: ${m}`);
const fail = (m: string) => results.push(`FAIL: ${m}`);

async function createTestBusiness(
  tier: BusinessSubscriptionTier,
): Promise<{ businessId: string; userId: string }> {
  const tag = `b2-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
          subscriptionTier: tier,
          subscription: {
            create: buildNestedSubscriptionCreateData({
              subscriptionTier: tier,
              source: "email_signup",
            }),
          },
        },
      },
    },
    include: { business: true },
  });
  if (!user.business) throw new Error("business missing after create");
  return { businessId: user.business.id, userId: user.id };
}

function testTierMatrix(): boolean {
  let ok = true;
  for (const feature of STARTER_FEATURES) {
    if (!hasFeatureForTier(BusinessSubscriptionTier.basic, feature)) {
      fail(`basic must have starter feature ${feature}`);
      ok = false;
    }
    if (!hasFeatureForTier(BusinessSubscriptionTier.premium, feature)) {
      fail(`premium must have starter feature ${feature}`);
      ok = false;
    }
  }
  for (const feature of BUSINESS_ONLY_FEATURES) {
    if (hasFeatureForTier(BusinessSubscriptionTier.basic, feature)) {
      fail(`basic must not have business feature ${feature}`);
      ok = false;
    }
    if (!hasFeatureForTier(BusinessSubscriptionTier.premium, feature)) {
      fail(`premium must have business feature ${feature}`);
      ok = false;
    }
    if (!hasFeatureForTier(BusinessSubscriptionTier.enterprise, feature)) {
      fail(`enterprise must have business feature ${feature}`);
      ok = false;
    }
  }
  if (ok) {
    pass("tier matrix: starter on basic+, business-only on premium+, enterprise full");
  }
  return ok;
}

function testTipsQueryHelpers(): boolean {
  let ok = true;
  if (!businessTipsQueryRequiresAdvancedAnalytics({ scope: "full" })) {
    fail("business tips: scope=full should require advanced analytics");
    ok = false;
  }
  if (businessTipsQueryRequiresAdvancedAnalytics({ range: "week" })) {
    fail("business tips: preset range only should not require advanced analytics");
    ok = false;
  }
  if (!employeeTipsListQueryRequiresAdvancedAnalytics({ range: "custom" })) {
    fail("employee tips list: custom range should require advanced analytics");
    ok = false;
  }
  if (employeeTipsListQueryRequiresAdvancedAnalytics({ range: "month" })) {
    fail("employee tips list: preset month should not require advanced analytics");
    ok = false;
  }
  if (ok) pass("tips query helpers: basic vs premium access rules");
  return ok;
}

function testMaskEmployeeGoals(): boolean {
  const masked = maskEmployeeGoalsInResponse(
    { goal: { id: "g1" }, monthlyGoal: 100, tips: [] },
    false,
  );
  if (masked.goal !== null || masked.monthlyGoal !== null) {
    fail("maskEmployeeGoalsInResponse should null goal fields when disabled");
    return false;
  }
  const kept = maskEmployeeGoalsInResponse(
    { goal: { id: "g1" }, monthlyGoal: 100 },
    true,
  );
  if (kept.goal === null || kept.monthlyGoal === null) {
    fail("maskEmployeeGoalsInResponse should preserve goal fields when enabled");
    return false;
  }
  pass("maskEmployeeGoalsInResponse strips goals for basic tier responses");
  return true;
}

async function testMissingTierDefaultsNone(): Promise<boolean> {
  const tier = await getSubscriptionTierForBusinessId("nonexistent-business-id-b21");
  if (tier !== null) {
    fail(`missing business tier should be null, got ${tier}`);
    return false;
  }
  pass("getSubscriptionTierForBusinessId: missing business returns null");
  return true;
}

async function testHasFeatureDbTiers(): Promise<boolean> {
  const basic = await createTestBusiness(BusinessSubscriptionTier.basic);
  const premium = await createTestBusiness(BusinessSubscriptionTier.premium);
  const enterprise = await createTestBusiness(BusinessSubscriptionTier.enterprise);

  let ok = true;
  for (const feature of STARTER_FEATURES) {
    if (!(await hasFeature(basic.businessId, feature))) {
      fail(`hasFeature DB: basic business should have starter feature ${feature}`);
      ok = false;
    }
  }
  for (const feature of BUSINESS_ONLY_FEATURES) {
    if (await hasFeature(basic.businessId, feature)) {
      fail(`hasFeature DB: basic business should not have business feature ${feature}`);
      ok = false;
    }
    if (!(await hasFeature(premium.businessId, feature))) {
      fail(`hasFeature DB: premium business should have business feature ${feature}`);
      ok = false;
    }
    if (!(await hasFeature(enterprise.businessId, feature))) {
      fail(`hasFeature DB: enterprise business should have business feature ${feature}`);
      ok = false;
    }
  }
  if (ok) {
    pass("hasFeature(businessId): starter on basic, business features on premium + enterprise");
  }
  return ok;
}

async function testMultiLocationBasicCap(): Promise<boolean> {
  const { userId } = await createTestBusiness(BusinessSubscriptionTier.basic);
  await createLocationForBusinessUser(userId, "Primary site");
  try {
    await createLocationForBusinessUser(userId, "Second site");
    fail("basic tier should not create a second location");
    return false;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes("one location")) {
      fail(`basic second location: unexpected error: ${msg}`);
      return false;
    }
  }
  pass("multi-location: basic capped at one location on create");
  return true;
}

async function testMultiLocationPremiumUnlimited(): Promise<boolean> {
  const { userId } = await createTestBusiness(BusinessSubscriptionTier.premium);
  await createLocationForBusinessUser(userId, "Site A");
  await createLocationForBusinessUser(userId, "Site B");
  pass("multi-location: premium may create multiple locations");
  return true;
}

async function main() {
  let ok = true;
  ok = testTierMatrix() && ok;
  ok = testTipsQueryHelpers() && ok;
  ok = testMaskEmployeeGoals() && ok;
  ok = (await testMissingTierDefaultsNone()) && ok;
  ok = (await testHasFeatureDbTiers()) && ok;
  ok = (await testMultiLocationBasicCap()) && ok;
  ok = (await testMultiLocationPremiumUnlimited()) && ok;

  if (capabilitiesForTier(BusinessSubscriptionTier.basic).length !== STARTER_FEATURES.length) {
    fail("basic tier capability count mismatch");
    ok = false;
  } else {
    pass("capabilitiesForTier: basic returns starter capability set");
  }

  console.log("Phase B.2.1 backend entitlements runtime checks\n");
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
