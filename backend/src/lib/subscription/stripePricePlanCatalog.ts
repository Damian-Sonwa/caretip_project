import type { SubscriptionPlanKey } from "@prisma/client";

/**
 * Known Stripe Price IDs → CareTip plan keys (basic = Starter, premium = Business, enterprise).
 * Kept in code so webhooks resolve plans even when env vars are missing or the process
 * was started before backend/.env was updated. Env STRIPE_PRICE_* vars extend/override this map.
 */
export const KNOWN_STRIPE_PRICE_TO_PLAN_KEY: Readonly<Record<string, SubscriptionPlanKey>> = {
  // CareTip Basic (Starter)
  price_1TlEhC66w930Tx0ALNcoCaui: "basic", // monthly
  price_1TlEjs66w930Tx0AOAQyKjuQ: "basic", // yearly

  // CareTip Premium (Business)
  price_1TmJtr66w930Tx0AP8elVcUU: "premium", // monthly (active replacement)
  price_1TlEFm66w930Tx0AXM44YJ9O: "premium", // monthly (legacy, inactive)
  price_1TlEL366w930Tx0AO8Tsp5wq: "premium", // yearly

  // CareTip Enterprise
  price_1TlEaN66w930Tx0AEenHAABm: "enterprise", // monthly
  price_1TlEe566w930Tx0AjjIdNFcd: "enterprise", // yearly
};

export const STRIPE_PRICE_ENV_KEYS = [
  "STRIPE_PRICE_BASIC_MONTHLY",
  "STRIPE_PRICE_BASIC_YEARLY",
  "STRIPE_PRICE_PREMIUM_MONTHLY",
  "STRIPE_PRICE_PREMIUM_YEARLY",
  "STRIPE_PRICE_ENTERPRISE_MONTHLY",
  "STRIPE_PRICE_ENTERPRISE_YEARLY",
] as const;

const ENV_KEY_TO_PLAN: Record<(typeof STRIPE_PRICE_ENV_KEYS)[number], SubscriptionPlanKey> = {
  STRIPE_PRICE_BASIC_MONTHLY: "basic",
  STRIPE_PRICE_BASIC_YEARLY: "basic",
  STRIPE_PRICE_PREMIUM_MONTHLY: "premium",
  STRIPE_PRICE_PREMIUM_YEARLY: "premium",
  STRIPE_PRICE_ENTERPRISE_MONTHLY: "enterprise",
  STRIPE_PRICE_ENTERPRISE_YEARLY: "enterprise",
};

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

/** Build priceId → planKey map: known catalog first, then env (env wins on duplicate keys). */
export function buildStripePriceToPlanKeyMap(): Record<string, SubscriptionPlanKey> {
  const out: Record<string, SubscriptionPlanKey> = { ...KNOWN_STRIPE_PRICE_TO_PLAN_KEY };
  for (const envKey of STRIPE_PRICE_ENV_KEYS) {
    const priceId = normalizeStripePriceIdEnv(process.env[envKey]);
    if (priceId) out[priceId] = ENV_KEY_TO_PLAN[envKey];
  }
  return out;
}
