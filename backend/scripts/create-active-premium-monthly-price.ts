/**
 * Creates a new active Premium monthly Stripe price when the configured one is inactive.
 * Run: npm run stripe:create-premium-monthly-price
 */
import "dotenv/config";
import "../src/loadEnv.js";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import Stripe from "stripe";
import { isStripeConfigured } from "../src/services/stripe.service.js";

/** Inactive price used as template when creating a replacement monthly price. */
const INACTIVE_PREMIUM_MONTHLY_FALLBACK = "price_1TlEFm66w930Tx0AXM44YJ9O";

async function main(): Promise<void> {
  if (!isStripeConfigured()) {
    console.error("FAIL: STRIPE_SECRET_KEY is not configured.");
    process.exitCode = 1;
    return;
  }

  const envPath = join(process.cwd(), ".env");
  const configuredId = process.env.STRIPE_PRICE_PREMIUM_MONTHLY?.trim();
  if (!configuredId) {
    console.error("FAIL: STRIPE_PRICE_PREMIUM_MONTHLY is not set.");
    process.exitCode = 1;
    return;
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim());
  let templateId = configuredId;
  try {
    const configured = await stripe.prices.retrieve(configuredId);
    if (configured.active && configured.recurring?.interval === "month") {
      console.log(`OK: ${configuredId} is an active monthly price — no change needed.`);
      return;
    }
    if (configured.active && configured.recurring?.interval === "year") {
      console.warn(
        `WARN: STRIPE_PRICE_PREMIUM_MONTHLY points to a yearly price (${configuredId}). Creating a proper monthly price.`,
      );
      templateId = INACTIVE_PREMIUM_MONTHLY_FALLBACK;
    }
  } catch {
    templateId = INACTIVE_PREMIUM_MONTHLY_FALLBACK;
  }

  const template = await stripe.prices.retrieve(templateId);
  const productId = typeof template.product === "string" ? template.product : template.product.id;
  const newPrice = await stripe.prices.create({
    product: productId,
    unit_amount: template.unit_amount ?? 4900,
    currency: template.currency ?? "eur",
    recurring: { interval: "month" },
    metadata: { caretipPlanKey: "premium", planKey: "premium" },
  });

  console.log(`Created active monthly price: ${newPrice.id} (${newPrice.unit_amount} ${newPrice.currency}/month)`);

  let envText = readFileSync(envPath, "utf8");
  const replaced = envText.replace(
    /STRIPE_PRICE_PREMIUM_MONTHLY="[^"]*"/,
    `STRIPE_PRICE_PREMIUM_MONTHLY="${newPrice.id}"`,
  );
  if (replaced === envText) {
    console.log(`\nAdd to backend/.env:\nSTRIPE_PRICE_PREMIUM_MONTHLY="${newPrice.id}"`);
  } else {
    writeFileSync(envPath, replaced, "utf8");
    console.log("Updated backend/.env with the new monthly price ID.");
    console.log("Restart the backend (npm run dev) before retrying checkout.");
  }
}

void main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exitCode = 1;
});
