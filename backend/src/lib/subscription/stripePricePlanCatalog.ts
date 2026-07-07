import type { SubscriptionPlanKey } from "@prisma/client";

/**
 * Known Stripe Price IDs → CareTip plan keys.
 * Kept in code so webhooks resolve plans even when env vars are missing or the process
 * was started before backend/.env was updated. Env STRIPE_PRICE_PREMIUM_* vars extend/override
 * this map for the active Pro checkout prices.
 *
 * Basic (`basic`) and Premium (`enterprise`) legacy price IDs remain for webhook resolution
 * on existing Stripe subscriptions — new checkout never uses them.
 */
export const LEGACY_BASIC_STRIPE_PRICE_IDS = [
  "price_1TlEhC66w930Tx0ALNcoCaui", // monthly (legacy)
  "price_1TlEjs66w930Tx0AOAQyKjuQ", // yearly (legacy)
] as const;

export const KNOWN_STRIPE_PRICE_TO_PLAN_KEY: Readonly<Record<string, SubscriptionPlanKey>> = {
  // Legacy CareTip Basic (Starter) — webhook resolution only
  price_1TlEhC66w930Tx0ALNcoCaui: "basic",
  price_1TlEjs66w930Tx0AOAQyKjuQ: "basic",

  // CareTip Pro (internal planKey `premium`)
  price_1TqZcI66w930Tx0AUQL29FY4: "premium", // monthly (Pro product — active)
  price_1TqZeX66w930Tx0A1A94g6gd: "premium", // yearly (Pro product — active)
  price_1TmJtr66w930Tx0AP8elVcUU: "premium", // monthly (legacy, inactive)
  price_1TlEFm66w930Tx0AXM44YJ9O: "premium", // monthly (legacy, inactive)
  price_1TlEL366w930Tx0AO8Tsp5wq: "premium", // yearly (legacy)

  // CareTip Premium / Enterprise — webhook resolution only (contact sales)
  price_1TlEaN66w930Tx0AEenHAABm: "enterprise", // monthly
  price_1TlEe566w930Tx0AjjIdNFcd: "enterprise", // yearly
};

/** Required for self-serve Pro checkout (internal key `premium`). */
export const STRIPE_CHECKOUT_PRICE_ENV_KEYS = [
  "STRIPE_PRICE_PREMIUM_MONTHLY",
  "STRIPE_PRICE_PREMIUM_YEARLY",
] as const;

export type StripeCheckoutPriceEnvKey = (typeof STRIPE_CHECKOUT_PRICE_ENV_KEYS)[number];

const CHECKOUT_ENV_KEY_TO_PLAN: Record<StripeCheckoutPriceEnvKey, SubscriptionPlanKey> = {
  STRIPE_PRICE_PREMIUM_MONTHLY: "premium",
  STRIPE_PRICE_PREMIUM_YEARLY: "premium",
};

/** @deprecated Use {@link STRIPE_CHECKOUT_PRICE_ENV_KEYS}. Kept for scripts that still import this name. */
export const STRIPE_PRICE_ENV_KEYS = STRIPE_CHECKOUT_PRICE_ENV_KEYS;

/** Strip optional surrounding quotes from dotenv values. */
export function normalizeStripePriceIdEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim() || undefined;
  }
  return trimmed;
}

/** Resolve env var name for Pro checkout price (internal planKey `premium` only). */
export function stripeCheckoutPriceEnvKey(
  billingCycle: "monthly" | "yearly",
): StripeCheckoutPriceEnvKey {
  return billingCycle === "yearly"
    ? "STRIPE_PRICE_PREMIUM_YEARLY"
    : "STRIPE_PRICE_PREMIUM_MONTHLY";
}

/** Resolve configured Stripe Price ID for Pro self-serve checkout. */
export function resolveStripeCheckoutPriceId(billingCycle: "monthly" | "yearly"): string {
  const envKey = stripeCheckoutPriceEnvKey(billingCycle);
  const priceId = normalizeStripePriceIdEnv(process.env[envKey]);
  if (!priceId) {
    throw new Error(`Stripe price not configured for premium ${billingCycle} (${envKey})`);
  }
  return priceId;
}

/** Build priceId → planKey map: known catalog first, then env (env wins on duplicate keys). */
export function buildStripePriceToPlanKeyMap(): Record<string, SubscriptionPlanKey> {
  const out: Record<string, SubscriptionPlanKey> = { ...KNOWN_STRIPE_PRICE_TO_PLAN_KEY };
  for (const envKey of STRIPE_CHECKOUT_PRICE_ENV_KEYS) {
    const priceId = normalizeStripePriceIdEnv(process.env[envKey]);
    if (priceId) out[priceId] = CHECKOUT_ENV_KEY_TO_PLAN[envKey];
  }
  return out;
}
