/** Platform subscription free trial — Stripe Checkout `trial_period_days`. */
export const SUBSCRIPTION_TRIAL_PERIOD_DAYS = (() => {
  const raw = process.env.STRIPE_TRIAL_PERIOD_DAYS?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 28;
  return Number.isFinite(n) && n > 0 ? n : 28;
})();

export function isSubscriptionTrialEnabled(): boolean {
  return process.env.SUBSCRIPTION_TRIAL_ENABLED?.trim().toLowerCase() !== "false";
}
