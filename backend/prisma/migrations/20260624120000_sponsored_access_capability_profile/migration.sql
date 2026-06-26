-- Per-grant capability profile override (falls back to programme default when null)

ALTER TABLE "sponsored_access_grants" ADD COLUMN "capability_profile_key" TEXT;
