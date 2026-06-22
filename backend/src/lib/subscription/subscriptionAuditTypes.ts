/** Application-layer subscription audit types (Phase B.0+). */
export const SUBSCRIPTION_AUDIT_TYPES = {
  created: "subscription_created",
  planChanged: "subscription_plan_changed",
} as const;

/** Stripe billing webhook audit types (Phase B.1+). */
export const STRIPE_BILLING_AUDIT_TYPES = {
  subscriptionCreated: "stripe_subscription_created",
  subscriptionUpdated: "stripe_subscription_updated",
  subscriptionDeleted: "stripe_subscription_deleted",
  invoicePaymentSucceeded: "invoice_payment_succeeded",
  invoicePaymentFailed: "payment_failed",
  checkoutSessionCompleted: "checkout_session_completed",
  reconciliationRepair: "reconciliation_repair",
} as const;

/** Reserved for `db:backfill-subscriptions` only — never emit from application code. */
export const SUBSCRIPTION_AUDIT_TYPE_MIGRATION_BACKFILL = "migration_backfill" as const;

export type SubscriptionMirrorSource = "email_signup" | "oauth_signup" | "auto_heal";

export const BILLING_CHECKOUT_METADATA_KEYS = {
  businessId: "caretipBusinessId",
  subscriptionId: "caretipSubscriptionId",
  planKey: "caretipPlanKey",
  source: "platform_checkout",
} as const;
