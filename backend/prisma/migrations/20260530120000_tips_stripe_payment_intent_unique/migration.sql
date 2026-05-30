-- Enforce one tip row per Stripe PaymentIntent (NULLs allowed for legacy/seed rows).
-- Fails fast if duplicates exist so operators can resolve before deploy.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "tips"
    WHERE "stripe_payment_intent_id" IS NOT NULL
    GROUP BY "stripe_payment_intent_id"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate stripe_payment_intent_id values exist in tips. Run audit-stripe-payment-intent-duplicates.ts and resolve before migrating.';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "tips_stripe_payment_intent_id_key"
  ON "tips" ("stripe_payment_intent_id");
