/**
 * Reproduce createPlatformSubscriptionCheckoutSession for a real business row.
 * Run: npm run investigate:billing-checkout-live
 */
import "dotenv/config";
import "../src/loadEnv.js";
import Stripe from "stripe";
import { prisma } from "../src/prisma.js";
import { createPlatformSubscriptionCheckoutSession } from "../src/services/stripeBilling.service.js";
import { isSubscriptionTrialEnabled } from "../src/config/subscriptionTrial.js";

async function main() {
  const business = await prisma.business.findFirst({
    where: { subscription: { isNot: null } },
    select: {
      id: true,
      name: true,
      user: { select: { email: true } },
      subscription: { select: { id: true, status: true, stripeCustomerId: true, stripeSubscriptionId: true } },
    },
  });

  if (!business?.subscription || !business.user.email) {
    console.error("No business with subscription mirror found");
    process.exitCode = 1;
    return;
  }

  console.log("Business:", business.id);
  console.log("Mirror status:", business.subscription.status);
  console.log("stripeCustomerId:", business.subscription.stripeCustomerId);
  console.log("stripeSubscriptionId:", business.subscription.stripeSubscriptionId);
  console.log("SUBSCRIPTION_TRIAL_ENABLED:", isSubscriptionTrialEnabled());
  console.log("STRIPE_PRICE_PREMIUM_MONTHLY:", process.env.STRIPE_PRICE_PREMIUM_MONTHLY);

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim());
  const priceId = process.env.STRIPE_PRICE_PREMIUM_MONTHLY!.trim();
  const price = await stripe.prices.retrieve(priceId);
  console.log("Resolved price active=", price.active, "interval=", price.recurring?.interval);

  try {
    const session = await createPlatformSubscriptionCheckoutSession({
      businessId: business.id,
      subscriptionId: business.subscription.id,
      managerEmail: business.user.email,
      businessName: business.name,
      planKey: "premium",
      billingCycle: "monthly",
      includeTrial: true,
    });
    console.log("SUCCESS sessionId=", session.sessionId, "url=", session.url?.slice(0, 60));
  } catch (e) {
    if (e instanceof Stripe.errors.StripeError) {
      console.error("FAIL Stripe", e.type, e.message);
      console.error("param:", (e as Stripe.errors.StripeInvalidRequestError).param);
      console.error("code:", e.code);
    } else {
      console.error("FAIL", e instanceof Error ? e.message : e);
    }
    process.exitCode = 1;
  }

  await prisma.$disconnect();
}

void main();
