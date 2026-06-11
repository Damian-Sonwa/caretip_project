-- KYC queue metrics: index verification_status for filtered counts on businesses table.
CREATE INDEX IF NOT EXISTS "businesses_verification_status_idx" ON "businesses" ("verification_status");

-- Partial index for pending KYC rows (metrics query hot path).
CREATE INDEX IF NOT EXISTS "businesses_verification_pending_kyc_idx"
  ON "businesses" ("verification_status", "kyc_submitted_at")
  WHERE "verification_status" = 'pending';
