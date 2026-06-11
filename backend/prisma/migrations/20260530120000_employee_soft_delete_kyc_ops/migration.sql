-- Employee soft delete + KYC operations fields (Sprint 4)
ALTER TABLE "employees"
  ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS "employees_business_id_is_deleted_idx"
  ON "employees" ("business_id", "is_deleted");

ALTER TABLE "businesses"
  ADD COLUMN IF NOT EXISTS "kyc_review_notes" TEXT,
  ADD COLUMN IF NOT EXISTS "kyc_review_history" JSONB;
