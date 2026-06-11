-- Optional public website URL on business profile (onboarding / settings).
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "website" TEXT;
