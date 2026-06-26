-- Option A: no fake Starter mirrors; nullable subscription_tier; Stripe customer on Business for checkout.

ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "stripe_customer_id" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "businesses_stripe_customer_id_key" ON "businesses"("stripe_customer_id");

-- Drop NOT NULL before any null tier writes.
ALTER TABLE "businesses" ALTER COLUMN "subscription_tier" DROP DEFAULT;
ALTER TABLE "businesses" ALTER COLUMN "subscription_tier" DROP NOT NULL;

UPDATE "businesses" b
SET "stripe_customer_id" = s."stripe_customer_id"
FROM "subscriptions" s
WHERE s."business_id" = b."id"
  AND b."stripe_customer_id" IS NULL
  AND s."stripe_customer_id" IS NOT NULL;

-- Remove signup shell mirrors only (no Stripe linkage, active Starter, never trialed).
DELETE FROM "subscriptions" s
WHERE s."stripe_subscription_id" IS NULL
  AND s."stripe_customer_id" IS NULL
  AND s."status" = 'active'
  AND s."plan_key" = 'basic'
  AND s."is_trial" = false
  AND s."trial_started_at" IS NULL
  AND s."trial_ends_at" IS NULL;

UPDATE "businesses" b
SET "subscription_tier" = CASE s."plan_key"
  WHEN 'basic' THEN 'basic'::"BusinessSubscriptionTier"
  WHEN 'premium' THEN 'premium'::"BusinessSubscriptionTier"
  WHEN 'enterprise' THEN 'enterprise'::"BusinessSubscriptionTier"
END
FROM "subscriptions" s
WHERE s."business_id" = b."id";

UPDATE "businesses" b
SET "subscription_tier" = NULL
WHERE NOT EXISTS (
  SELECT 1 FROM "subscriptions" s WHERE s."business_id" = b."id"
);
