-- Adds the optional website field to existing databases.
-- Use when Prisma migrate deploy cannot run cleanly (drift / modified past migrations).
--
-- Safe to run multiple times.

ALTER TABLE "public"."businesses"
  ADD COLUMN IF NOT EXISTS "website" TEXT;

