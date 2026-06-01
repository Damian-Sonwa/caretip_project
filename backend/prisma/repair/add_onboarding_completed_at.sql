-- Explicit onboarding completion timestamp (distinguishes wizard finish from legacy auto-sync).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboarding_completed_at" TIMESTAMP(3);

-- Clear completion flags that were set without an explicit finish timestamp.
UPDATE "User"
SET
  "has_completed_onboarding" = false,
  "onboarding_completed_at" = NULL
WHERE "has_completed_onboarding" = true
  AND "onboarding_completed_at" IS NULL;
