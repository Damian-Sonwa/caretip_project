-- Separate onboarding platform-access approval from KYC compliance verification.

CREATE TYPE "OnboardingVerificationStatus" AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected'
);

CREATE TYPE "KycVerificationStatus" AS ENUM (
  'not_started',
  'awaiting_upload',
  'pending_review',
  'verified',
  'rejected'
);

ALTER TABLE "businesses"
  ADD COLUMN "onboarding_verification_status" "OnboardingVerificationStatus" NOT NULL DEFAULT 'draft',
  ADD COLUMN "kyc_verification_status" "KycVerificationStatus" NOT NULL DEFAULT 'not_started',
  ADD COLUMN "onboarding_submitted_at" TIMESTAMP(3),
  ADD COLUMN "onboarding_review_notes" TEXT,
  ADD COLUMN "onboarding_review_history" JSONB;

CREATE INDEX "businesses_onboarding_verification_status_idx"
  ON "businesses"("onboarding_verification_status");

CREATE INDEX "businesses_kyc_verification_status_idx"
  ON "businesses"("kyc_verification_status");

-- Backfill onboarding: existing managers who finished the wizard keep dashboard access.
UPDATE "businesses" b
SET
  "onboarding_verification_status" = CASE
    WHEN u."has_completed_onboarding" = false THEN 'draft'::"OnboardingVerificationStatus"
    WHEN b."verification_status" = 'rejected' AND b."kyc_submitted_at" IS NULL THEN 'rejected'::"OnboardingVerificationStatus"
    ELSE 'approved'::"OnboardingVerificationStatus"
  END,
  "onboarding_submitted_at" = CASE
    WHEN u."has_completed_onboarding" = true THEN COALESCE(u."onboarding_completed_at", u."created_at")
    ELSE NULL
  END
FROM "User" u
WHERE u.id = b.user_id;

-- Backfill KYC from legacy verification_status + document fields
UPDATE "businesses"
SET "kyc_verification_status" = CASE
  WHEN "verification_status" = 'verified' THEN 'verified'::"KycVerificationStatus"
  WHEN "verification_status" = 'rejected' THEN 'rejected'::"KycVerificationStatus"
  WHEN "kyc_submitted_at" IS NOT NULL THEN 'pending_review'::"KycVerificationStatus"
  WHEN "kyc_documents" IS NOT NULL AND "kyc_documents"::text NOT IN ('null', '{}') THEN 'awaiting_upload'::"KycVerificationStatus"
  ELSE 'not_started'::"KycVerificationStatus"
END;
