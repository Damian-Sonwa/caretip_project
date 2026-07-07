/**
 * Commit 6 — Frontend migration verification (entitlements + cache assumptions).
 * Run: npm run test:subscription-migration-frontend
 */
import {
  capabilitiesForTier,
  hasFeature,
  hasSubscriptionCapability,
} from "../src/app/lib/subscriptionCapabilities";
import { isUnsubscribedDashboardPreview } from "../src/app/components/business/dashboard/isUnsubscribedDashboardPreview";
import { hasOperationalBillingPlan } from "../src/app/lib/billingDisplayState";
import type { BillingStatus } from "../src/app/lib/api";
import { persistCheckoutIntentFromSearchParams } from "../src/app/lib/checkoutIntent";

const results: string[] = [];
const pass = (m: string) => results.push(`PASS: ${m}`);
const fail = (m: string) => results.push(`FAIL: ${m}`);

function mockBilling(overrides: Partial<BillingStatus>): BillingStatus {
  return {
    planKey: "basic",
    billingCycle: "monthly",
    status: "active",
    trialStartedAt: null,
    trialEndsAt: null,
    isTrial: false,
    trialDaysRemaining: null,
    currentPeriodEnd: null,
    renewalDate: null,
    cancelAtPeriodEnd: false,
    cancellationEffective: null,
    hasStripeBilling: false,
    stripeCustomerId: null,
    subscriptionCreatedAt: null,
    syncedAt: null,
    subscriptionTier: "basic",
    billingEnabled: true,
    stripeConfigured: true,
    accessSource: "subscription",
    events: [],
    ...overrides,
  };
}

function testBasicNotUnsubscribed(): boolean {
  const billing = mockBilling({});
  if (!hasOperationalBillingPlan(billing)) {
    fail("basic billing should be operational");
    return false;
  }
  if (isUnsubscribedDashboardPreview(true, true)) {
    fail("basic entitlements should not trigger dashboard preview mode");
    return false;
  }
  pass("basic user: operational billing, no preview lock");
  return true;
}

function testLegacyNoneCacheAssumption(): boolean {
  const legacyNone = mockBilling({ planKey: null, status: "none", subscriptionTier: null });
  if (hasOperationalBillingPlan(legacyNone)) {
    fail("legacy status none without plan should not be operational");
    return false;
  }
  if (!isUnsubscribedDashboardPreview(true, false)) {
    fail("legacy none entitlements may still preview until profile refresh");
    return false;
  }
  pass("legacy cached none: preview until refresh (migration clears session cache v2)");
  return true;
}

function testBasicAllowsCoreBlocksPro(): boolean {
  let ok = true;
  const caps = capabilitiesForTier("basic");
  const allow = ["tipManagement", "employeeQr", "teamManagement", "tableQr"] as const;
  const block = ["advancedAnalytics", "brandingCustomization", "csvExport", "employeeGoals", "multiLocation"] as const;
  for (const key of allow) {
    if (!hasFeature("basic", key, caps)) {
      fail(`basic should allow ${key}`);
      ok = false;
    }
  }
  for (const key of block) {
    if (hasFeature("basic", key, caps)) {
      fail(`basic should block ${key}`);
      ok = false;
    }
  }
  if (ok) pass("basic allows core modules, blocks pro features");
  return ok;
}

function testCheckoutIntentSkipsBasic(): boolean {
  const saved = persistCheckoutIntentFromSearchParams(new URLSearchParams("plan=starter&cycle=monthly"));
  if (saved !== null) {
    fail("basic/starter signup must not persist checkout intent");
    return false;
  }
  pass("checkout intent: basic signup does not persist stripe checkout");
  return true;
}

function testProHasAdvanced(): boolean {
  if (!hasSubscriptionCapability("premium", "advancedAnalytics")) {
    fail("pro should have advancedAnalytics");
    return false;
  }
  pass("pro tier includes advanced capabilities");
  return true;
}

function main(): void {
  const checks = [
    testBasicNotUnsubscribed(),
    testLegacyNoneCacheAssumption(),
    testBasicAllowsCoreBlocksPro(),
    testCheckoutIntentSkipsBasic(),
    testProHasAdvanced(),
  ];
  console.log(results.join("\n"));
  if (checks.some((c) => !c)) {
    console.error(`\n${checks.filter((c) => !c).length} check group(s) failed.`);
    process.exit(1);
  }
  console.log(`\nAll ${checks.length} frontend migration check groups passed.`);
}

main();
