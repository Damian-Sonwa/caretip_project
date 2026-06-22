import type { SubscriptionPlanKey } from "@prisma/client";
import type Stripe from "stripe";

function parseEnvPriceMap(): Record<string, SubscriptionPlanKey> {
  const out: Record<string, SubscriptionPlanKey> = {};
  const pairs: Array<[string | undefined, SubscriptionPlanKey]> = [
    [process.env.STRIPE_PRICE_BASIC_MONTHLY?.trim(), "basic"],
    [process.env.STRIPE_PRICE_BASIC_YEARLY?.trim(), "basic"],
    [process.env.STRIPE_PRICE_PREMIUM_MONTHLY?.trim(), "premium"],
    [process.env.STRIPE_PRICE_PREMIUM_YEARLY?.trim(), "premium"],
    [process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY?.trim(), "enterprise"],
    [process.env.STRIPE_PRICE_ENTERPRISE_YEARLY?.trim(), "enterprise"],
  ];
  for (const [priceId, planKey] of pairs) {
    if (priceId) out[priceId] = planKey;
  }
  return out;
}

function planKeyFromMetadata(metadata: Stripe.Metadata | null | undefined): SubscriptionPlanKey | null {
  const raw =
    metadata?.caretipPlanKey?.trim() ||
    metadata?.planKey?.trim() ||
    metadata?.plan_key?.trim();
  if (raw === "basic" || raw === "premium" || raw === "enterprise") {
    return raw;
  }
  return null;
}

/** Resolve Stripe Price → SubscriptionPlanKey (metadata first, then env map). */
export function mapStripePriceToPlanKey(price: Stripe.Price | string): SubscriptionPlanKey {
  if (typeof price === "string") {
    const fromEnv = parseEnvPriceMap()[price];
    if (fromEnv) return fromEnv;
    throw new Error(`Unknown Stripe price id: ${price}`);
  }

  const fromMeta = planKeyFromMetadata(price.metadata);
  if (fromMeta) return fromMeta;

  const fromEnv = parseEnvPriceMap()[price.id];
  if (fromEnv) return fromEnv;

  throw new Error(`Unable to map Stripe price ${price.id} to planKey`);
}
