/**
 * Verify configured Stripe Pro billing prices are active.
 * Run: npm run verify:stripe-billing-prices
 */
import "dotenv/config";
import "../src/loadEnv.js";
import Stripe from "stripe";
import { isStripeConfigured } from "../src/services/stripe.service.js";
import { STRIPE_CHECKOUT_PRICE_ENV_KEYS } from "../src/lib/subscription/stripePricePlanCatalog.js";

async function main(): Promise<void> {
  if (!isStripeConfigured()) {
    console.error("FAIL: STRIPE_SECRET_KEY is not configured.");
    process.exitCode = 1;
    return;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim());
  let failed = 0;

  for (const envKey of STRIPE_CHECKOUT_PRICE_ENV_KEYS) {
    const priceId = process.env[envKey]?.trim();
    if (!priceId) {
      console.error(`FAIL: ${envKey} is not set (required for Pro checkout).`);
      failed += 1;
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
    console.log("\nPro checkout prices (STRIPE_PRICE_PREMIUM_*) are configured and active.");
  }
}

void main();
