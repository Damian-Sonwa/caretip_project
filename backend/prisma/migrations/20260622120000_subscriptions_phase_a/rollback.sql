-- Phase A rollback — drops subscription tables only (safe before Phase B Stripe billing writes).
-- Does NOT touch businesses.subscription_tier.

DROP TABLE IF EXISTS "subscription_events";
DROP TABLE IF EXISTS "subscriptions";

DROP TYPE IF EXISTS "SubscriptionEventProcessingResult";
DROP TYPE IF EXISTS "TrialSource";
DROP TYPE IF EXISTS "SubscriptionStatus";
DROP TYPE IF EXISTS "BillingCycle";
DROP TYPE IF EXISTS "SubscriptionPlanKey";
