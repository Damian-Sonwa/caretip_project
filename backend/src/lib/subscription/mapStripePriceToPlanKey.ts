import type { SubscriptionPlanKey } from "@prisma/client";
import type Stripe from "stripe";
import {
  buildStripePriceToPlanKeyMap,
  normalizeStripePriceIdEnv,
} from "./stripePricePlanCatalog.js";

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

function lookupPlanKeyForPriceId(priceId: string): SubscriptionPlanKey | undefined {
  return buildStripePriceToPlanKeyMap()[normalizeStripePriceIdEnv(priceId) ?? priceId];
}

/** Resolve Stripe Price → SubscriptionPlanKey (metadata first, then catalog + env map). */
export function mapStripePriceToPlanKey(price: Stripe.Price | string): SubscriptionPlanKey {
  if (typeof price === "string") {
    const fromMap = lookupPlanKeyForPriceId(price);
    if (fromMap) return fromMap;
    throw new Error(`Unknown Stripe price id: ${price}`);
  }

  const fromMeta = planKeyFromMetadata(price.metadata);
  if (fromMeta) return fromMeta;

  const fromMap = lookupPlanKeyForPriceId(price.id);
  if (fromMap) return fromMap;

  throw new Error(`Unable to map Stripe price ${price.id} to planKey`);
}

export type PlanKeyResolutionSource = "price" | "subscription_metadata";

export type PlanKeyResolution = {
  planKey: SubscriptionPlanKey;
  source: PlanKeyResolutionSource;
};

/**
 * Resolve plan key from Stripe Price, falling back to Subscription metadata
 * (caretipPlanKey is set on subscription_data during platform checkout).
 */
export function resolvePlanKeyForStripeSubscription(
  sub: Stripe.Subscription,
  price: Stripe.Price | string,
): PlanKeyResolution {
  try {
    return { planKey: mapStripePriceToPlanKey(price), source: "price" };
  } catch (priceErr) {
    const fromSubscriptionMetadata = planKeyFromMetadata(sub.metadata);
    if (fromSubscriptionMetadata) {
      return { planKey: fromSubscriptionMetadata, source: "subscription_metadata" };
    }
    throw priceErr;
  }
}

export { buildStripePriceToPlanKeyMap, KNOWN_STRIPE_PRICE_TO_PLAN_KEY } from "./stripePricePlanCatalog.js";
