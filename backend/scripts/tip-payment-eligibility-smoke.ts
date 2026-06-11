/**
 * Smoke checks for tip payment eligibility rules (no Stripe / DB seed required for unit paths).
 * Run: npm run smoke:tip-payment-eligibility
 */
import assert from "node:assert/strict";
import { TipPaymentEligibilityError } from "../src/services/tipPaymentEligibility.service.js";

function pass(msg: string) {
  console.log(`  ✓ ${msg}`);
}

async function main() {
  console.log("tip-payment-eligibility-smoke\n");

  const err = new TipPaymentEligibilityError("test", "TEST_CODE");
  assert.equal(err.code, "TEST_CODE");
  assert.equal(err.name, "TipPaymentEligibilityError");
  pass("TipPaymentEligibilityError exposes code");

  const { assertEmployeeEligibleForTipPayment } = await import(
    "../src/services/tipPaymentEligibility.service.js"
  );
  assert.equal(typeof assertEmployeeEligibleForTipPayment, "function");
  pass("assertEmployeeEligibleForTipPayment export present");

  console.log("\nStatic smoke passed. Run integration QA on staging with inactive/unverified employees.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
