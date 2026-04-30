-- Adds the business onboarding completion flag to existing databases.
-- Use when Prisma migrate deploy cannot run cleanly (e.g. drift / modified past migrations).
--
-- Safe to run multiple times.

ALTER TABLE "public"."User"
  ADD COLUMN IF NOT EXISTS "has_completed_onboarding" BOOLEAN NOT NULL DEFAULT false;

