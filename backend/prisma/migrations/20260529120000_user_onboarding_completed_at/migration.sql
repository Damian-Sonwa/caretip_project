-- Manager onboarding completion flag + timestamp (explicit finish only).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "has_completed_onboarding" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "onboarding_completed_at" TIMESTAMP(3);

-- Legacy rows that were auto-marked complete without a finish action.
UPDATE "User"
SET
  "has_completed_onboarding" = false,
  "onboarding_completed_at" = NULL
WHERE "has_completed_onboarding" = true
  AND "onboarding_completed_at" IS NULL;
