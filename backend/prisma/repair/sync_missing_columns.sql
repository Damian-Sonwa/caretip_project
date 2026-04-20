-- Run this in Supabase → SQL Editor if sign-in fails with Prisma P2022 (column does not exist).
-- Then: cd backend && npx prisma migrate resolve --applied 20260402120000_repair_missing_columns
-- (only if you applied this SQL manually instead of prisma migrate deploy)

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "logo_path" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "verification_document_path" TEXT;
