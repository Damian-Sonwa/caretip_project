-- Collapse obsolete onboarding "under_review" into "submitted" and remove enum value.

UPDATE "Business"
SET "onboarding_verification_status" = 'submitted'
WHERE "onboarding_verification_status" = 'under_review';

ALTER TYPE "OnboardingVerificationStatus" RENAME TO "OnboardingVerificationStatus_old";

CREATE TYPE "OnboardingVerificationStatus" AS ENUM (
  'draft',
  'submitted',
  'approved',
  'rejected'
);

ALTER TABLE "Business"
  ALTER COLUMN "onboarding_verification_status" DROP DEFAULT;

ALTER TABLE "Business"
  ALTER COLUMN "onboarding_verification_status" TYPE "OnboardingVerificationStatus"
  USING ("onboarding_verification_status"::text::"OnboardingVerificationStatus");

ALTER TABLE "Business"
  ALTER COLUMN "onboarding_verification_status" SET DEFAULT 'draft';

DROP TYPE "OnboardingVerificationStatus_old";
