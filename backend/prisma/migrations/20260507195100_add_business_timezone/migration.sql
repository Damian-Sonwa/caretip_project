-- Add timezone to businesses for timezone-aware analytics.
-- IANA timezone name (e.g. "Europe/Berlin"). All timestamps remain stored in UTC.

ALTER TABLE "public"."businesses"
ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'Europe/Berlin';

