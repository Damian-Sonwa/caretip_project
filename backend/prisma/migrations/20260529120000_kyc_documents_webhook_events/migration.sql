-- Manager KYC document bundle + Stripe webhook idempotency
ALTER TABLE "businesses"
  ADD COLUMN IF NOT EXISTS "kyc_documents" JSONB,
  ADD COLUMN IF NOT EXISTS "kyc_submitted_at" TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS "stripe_webhook_events" (
  "id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "processed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "stripe_webhook_events_processed_at_idx"
  ON "stripe_webhook_events" ("processed_at");
