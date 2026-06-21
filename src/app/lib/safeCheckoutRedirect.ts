const STRIPE_CHECKOUT_HOST = "checkout.stripe.com";

/** Redirect only to Stripe-hosted Checkout URLs returned by our payment API. */
export function redirectToStripeCheckoutUrl(rawUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error("Invalid checkout URL");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Checkout URL must use HTTPS");
  }
  if (parsed.hostname !== STRIPE_CHECKOUT_HOST) {
    throw new Error("Checkout URL must be hosted by Stripe");
  }
  window.location.assign(parsed.href);
}
