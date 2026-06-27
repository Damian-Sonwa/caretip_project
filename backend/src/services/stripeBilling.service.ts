import type Stripe from "stripe";
import { isSubscriptionBillingEnabled } from "../config/featureFlags.js";
import { getStripeClient, isStripeConfigured } from "./stripe.service.js";
import { BILLING_CHECKOUT_METADATA_KEYS } from "../lib/subscription/subscriptionAuditTypes.js";
import { mapBusinessTierToPlanKey } from "../lib/subscription/mapSubscriptionPlanKey.js";
import type { SubscriptionPlanKey } from "@prisma/client";
import { prisma } from "../prisma.js";
import {
  isSubscriptionTrialEnabled,
  SUBSCRIPTION_TRIAL_PERIOD_DAYS,
} from "../config/subscriptionTrial.js";

function frontendBaseUrl(): string {
  return (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/$/, "");
}

export type SubscriptionCheckoutFlow = "billing" | "onboarding";

function checkoutReturnUrls(flow: SubscriptionCheckoutFlow): {
  successUrl: string;
  cancelUrl: string;
} {
  const base = frontendBaseUrl();
  if (flow === "onboarding") {
    return {
      successUrl: `${base}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${base}/subscription/canceled`,
    };
  }
  return {
    successUrl: `${base}/dashboard/settings?billing=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${base}/dashboard/settings?billing=canceled`,
  };
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

/** Create or retrieve Stripe Customer for a business (stored on Business; mirrored on Subscription when present). */
export async function ensureStripeCustomerForBusiness(params: {
  businessId: string;
  email: string;
  businessName: string;
}): Promise<string> {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured");
  }

  const business = await prisma.business.findUnique({
    where: { id: params.businessId },
    select: {
      stripeCustomerId: true,
      subscription: { select: { stripeCustomerId: true } },
    },
  });

  const existing =
    business?.stripeCustomerId ?? business?.subscription?.stripeCustomerId ?? null;
  if (existing) {
    if (!business?.stripeCustomerId) {
      await prisma.business.update({
        where: { id: params.businessId },
        data: { stripeCustomerId: existing },
      });
    }
    return existing;
  }

  const stripe = getStripeClient();
  const customer = await stripe.customers.create({
    email: params.email,
    name: params.businessName,
    metadata: {
      [BILLING_CHECKOUT_METADATA_KEYS.businessId]: params.businessId,
    },
  });

  await prisma.business.update({
    where: { id: params.businessId },
    data: { stripeCustomerId: customer.id },
  });

  const subscriptionId = (
    await prisma.subscription.findUnique({
      where: { businessId: params.businessId },
      select: { id: true },
    })
  )?.id;

  if (subscriptionId) {
    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { stripeCustomerId: customer.id },
    });
  }

  return customer.id;
}

/** Create Stripe Checkout Session (mode: subscription). Gated by SUBSCRIPTION_BILLING_ENABLED. */
export async function createPlatformSubscriptionCheckoutSession(params: {
  businessId: string;
  subscriptionId?: string | null;
  managerEmail: string;
  businessName: string;
  planKey: SubscriptionPlanKey;
  billingCycle?: "monthly" | "yearly";
  /** When true, Stripe collects payment details and starts a free trial before the first charge. */
  includeTrial?: boolean;
  /** billing = existing dashboard upgrade flow; onboarding = pricing → signup → onboarding flow. */
  checkoutFlow?: SubscriptionCheckoutFlow;
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
    email: params.managerEmail,
    businessName: params.businessName,
  });

  const subscriptionId =
    params.subscriptionId ??
    (
      await prisma.subscription.findUnique({
        where: { businessId: params.businessId },
        select: { id: true },
      })
    )?.id ??
    null;

  const stripe = getStripeClient();
  const trialEligible =
    params.includeTrial === true &&
    isSubscriptionTrialEnabled() &&
    (params.planKey === "basic" || params.planKey === "premium");
  const subscriptionData: Stripe.Checkout.SessionCreateParams.SubscriptionData = {
    metadata: {
      [BILLING_CHECKOUT_METADATA_KEYS.businessId]: params.businessId,
      ...(subscriptionId
        ? { [BILLING_CHECKOUT_METADATA_KEYS.subscriptionId]: subscriptionId }
        : {}),
      [BILLING_CHECKOUT_METADATA_KEYS.planKey]: params.planKey,
      [BILLING_CHECKOUT_METADATA_KEYS.source]: "platform_checkout",
    },
    ...(trialEligible ? { trial_period_days: SUBSCRIPTION_TRIAL_PERIOD_DAYS } : {}),
  };

  const checkoutFlow = params.checkoutFlow ?? "billing";
  const { successUrl, cancelUrl } = checkoutReturnUrls(checkoutFlow);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    payment_method_collection: "always",
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: subscriptionData,
    metadata: {
      [BILLING_CHECKOUT_METADATA_KEYS.businessId]: params.businessId,
      ...(subscriptionId
        ? { [BILLING_CHECKOUT_METADATA_KEYS.subscriptionId]: subscriptionId }
        : {}),
      [BILLING_CHECKOUT_METADATA_KEYS.planKey]: params.planKey,
      [BILLING_CHECKOUT_METADATA_KEYS.source]: "platform_checkout",
    },
  });

  return { sessionId: session.id, url: session.url };
}

/** Stripe Customer Portal session (scaffold — API route in Phase B.2). */
export type BillingPortalFlow = "default" | "payment_methods";

export async function createBillingPortalSession(params: {
  stripeCustomerId: string;
  returnUrl?: string;
  flow?: BillingPortalFlow;
}): Promise<{ url: string }> {
  if (!isSubscriptionBillingEnabled()) {
    throw new Error("Subscription billing is not enabled");
  }
  const stripe = getStripeClient();
  const flow = params.flow ?? "default";
  const session = await stripe.billingPortal.sessions.create({
    customer: params.stripeCustomerId,
    return_url: params.returnUrl ?? `${frontendBaseUrl()}/dashboard/billing/invoices`,
    ...(flow === "payment_methods"
      ? { flow_data: { type: "payment_method_update" as const } }
      : {}),
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
