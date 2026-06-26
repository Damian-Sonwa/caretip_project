/**
 * Verify configured Stripe SaaS billing prices are active.
 * Run: npm run verify:stripe-billing-prices
 */
import "dotenv/config";
import "../src/loadEnv.js";
import Stripe from "stripe";
import { isStripeConfigured } from "../src/services/stripe.service.js";

const PRICE_ENV_KEYS = [
  "STRIPE_PRICE_BASIC_MONTHLY",
  "STRIPE_PRICE_BASIC_YEARLY",
  "STRIPE_PRICE_PREMIUM_MONTHLY",
  "STRIPE_PRICE_PREMIUM_YEARLY",
  "STRIPE_PRICE_ENTERPRISE_MONTHLY",
  "STRIPE_PRICE_ENTERPRISE_YEARLY",
] as const;

async function main(): Promise<void> {
  if (!isStripeConfigured()) {
    console.error("FAIL: STRIPE_SECRET_KEY is not configured.");
    process.exitCode = 1;
    return;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim());
  let failed = 0;

  for (const envKey of PRICE_ENV_KEYS) {
    const priceId = process.env[envKey]?.trim();
    if (!priceId) {
      console.log(`SKIP: ${envKey} (not set)`);
      continue;
    }
    try {
      const price = await stripe.prices.retrieve(priceId);
      if (!price.active) {
        console.error(`FAIL: ${envKey} → ${priceId} is INACTIVE in Stripe`);
        failed += 1;
      } else {
        console.log(`OK:   ${envKey} → ${priceId} (active)`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`FAIL: ${envKey} → ${priceId} (${msg})`);
      failed += 1;
    }
  }

  if (failed > 0) {
    console.error(
      `\n${failed} price(s) need attention. In Stripe Dashboard → Products, reactivate or create new prices, then update backend/.env.`,
    );
    process.exitCode = 1;
  } else {
    console.log("\nAll configured billing prices are active.");
  }
}

void main();
