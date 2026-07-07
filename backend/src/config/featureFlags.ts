/** Parse boolean env flags (`true` / `1` / `yes` / `on`). Empty or unset → false. */
function parseEnvFlag(raw: string | undefined): boolean {
  if (raw === undefined || raw === "") return false;
  const v = raw.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes" || v === "on";
}

/**
 * Landing Ask CareTip assistant (`/api/landing-ai/*` public chat + events).
 * Set `ENABLE_AI_ASSISTANT=true` to accept chat traffic. Default: disabled (503).
 * Routes and services remain mounted for future activation.
 */
export function isAiAssistantEnabled(): boolean {
  return parseEnvFlag(process.env.ENABLE_AI_ASSISTANT);
}

/**
 * Future dual-read path: Subscription.planKey + status instead of Business.subscriptionTier.
 * Default: false — production entitlements continue to read `subscriptionTier` only (Phase A).
 * Not wired to any read path yet.
 */
export function isSubscriptionV2ReadsEnabled(): boolean {
  return parseEnvFlag(process.env.SUBSCRIPTION_V2_READS);
}

/**
 * Platform SaaS Stripe billing writes (Checkout, billing webhooks, reconciliation).
 * Default: false — tip payments unaffected; billing handlers no-op when disabled.
 */
export function isSubscriptionBillingEnabled(): boolean {
  return parseEnvFlag(process.env.SUBSCRIPTION_BILLING_ENABLED);
}

/**
 * Internal Basic subscription on signup and lifecycle downgrade (Commit 1).
 * Default: enabled — set `SUBSCRIPTION_BASIC_DEFAULT_ENABLED=false` to restore Option A signup.
 */
export function isSubscriptionBasicDefaultEnabled(): boolean {
  const raw = process.env.SUBSCRIPTION_BASIC_DEFAULT_ENABLED;
  if (raw === undefined || raw === "") return true;
  return parseEnvFlag(raw);
}
