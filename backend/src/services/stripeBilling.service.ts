import type Stripe from "stripe";
import { isSubscriptionBillingEnabled } from "../config/featureFlags.js";
import { getStripeClient, isStripeConfigured } from "./stripe.service.js";
import { BILLING_CHECKOUT_METADATA_KEYS } from "../lib/subscription/subscriptionAuditTypes.js";
import { mapBusinessTierToPlanKey } from "../lib/subscription/mapSubscriptionPlanKey.js";
import type { SubscriptionPlanKey } from "@prisma/client";
import { prisma } from "../prisma.js";

function frontendBaseUrl(): string {
  return (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/$/, "");
}

function resolveCheckoutPriceId(planKey: SubscriptionPlanKey, billingCycle: "monthly" | "yearly"): string {
  const envKey =
    billingCycle === "yearly"
      ? {
          basic: process.env.STRIPE_PRICE_BASIC_YEARLY,
          premium: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
          enterprise: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY,
        }[planKey]
      : {
          basic: process.env.STRIPE_PRICE_BASIC_MONTHLY,
          premium: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
          enterprise: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY,
        }[planKey];

  const priceId = envKey?.trim();
  if (!priceId) {
    throw new Error(`Stripe price not configured for ${planKey} ${billingCycle}`);
  }
  return priceId;
}

/** Create or retrieve Stripe Customer for a business mirror row. */
export async function ensureStripeCustomerForBusiness(params: {
  businessId: string;
  subscriptionId: string;
  email: string;
  businessName: string;
}): Promise<string> {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured");
  }

  const existing = await prisma.subscription.findUnique({
    where: { id: params.subscriptionId },
    select: { stripeCustomerId: true },
  });
  if (existing?.stripeCustomerId) {
    return existing.stripeCustomerId;
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.businessName,
    metadata: {
      [BILLING_CHECKOUT_METADATA_KEYS.businessId]: params.businessId,
      [BILLING_CHECKOUT_METADATA_KEYS.subscriptionId]: params.subscriptionId,
    },
  });

  await prisma.subscription.update({
    where: { id: params.subscriptionId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

/** Create Stripe Checkout Session (mode: subscription). Gated by SUBSCRIPTION_BILLING_ENABLED. */
export async function createPlatformSubscriptionCheckoutSession(params: {
  businessId: string;
  subscriptionId: string;
  managerEmail: string;
  businessName: string;
  planKey: SubscriptionPlanKey;
  billingCycle?: "monthly" | "yearly";
}): Promise<{ sessionId: string; url: string | null }> {
  if (!isSubscriptionBillingEnabled()) {
    throw new Error("Subscription billing is not enabled");
  }
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured");
  }

  const billingCycle = params.billingCycle ?? "monthly";
  const priceId = resolveCheckoutPriceId(params.planKey, billingCycle);
  const customerId = await ensureStripeCustomerForBusiness({
    businessId: params.businessId,
    subscriptionId: params.subscriptionId,
    email: params.managerEmail,
    businessName: params.businessName,
  });

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${frontendBaseUrl()}/dashboard/settings?billing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendBaseUrl()}/dashboard/settings?billing=canceled`,
    subscription_data: {
      metadata: {
        [BILLING_CHECKOUT_METADATA_KEYS.businessId]: params.businessId,
        [BILLING_CHECKOUT_METADATA_KEYS.subscriptionId]: params.subscriptionId,
        [BILLING_CHECKOUT_METADATA_KEYS.planKey]: params.planKey,
        [BILLING_CHECKOUT_METADATA_KEYS.source]: "platform_checkout",
      },
    },
    metadata: {
      [BILLING_CHECKOUT_METADATA_KEYS.businessId]: params.businessId,
      [BILLING_CHECKOUT_METADATA_KEYS.subscriptionId]: params.subscriptionId,
      [BILLING_CHECKOUT_METADATA_KEYS.planKey]: params.planKey,
      [BILLING_CHECKOUT_METADATA_KEYS.source]: "platform_checkout",
    },
  });

  return { sessionId: session.id, url: session.url };
}

/** Stripe Customer Portal session (scaffold — API route in Phase B.2). */
export async function createBillingPortalSession(params: {
  stripeCustomerId: string;
  returnUrl?: string;
}): Promise<{ url: string }> {
  if (!isSubscriptionBillingEnabled()) {
    throw new Error("Subscription billing is not enabled");
  }
  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: params.stripeCustomerId,
    return_url: params.returnUrl ?? `${frontendBaseUrl()}/dashboard/settings`,
  });
  return { url: session.url };
}

/** Schedule cancel at period end via Stripe API (scaffold). */
export async function scheduleStripeSubscriptionCancelAtPeriodEnd(
  stripeSubscriptionId: string,
): Promise<Stripe.Subscription> {
  if (!isSubscriptionBillingEnabled()) {
    throw new Error("Subscription billing is not enabled");
  }
  const stripe = getStripeClient();
  return stripe.subscriptions.update(stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
}

/** Sync planKey on mirror before checkout from business tier if needed. */
export function planKeyForBusinessTier(tier: Parameters<typeof mapBusinessTierToPlanKey>[0]): SubscriptionPlanKey {
  return mapBusinessTierToPlanKey(tier);
}
