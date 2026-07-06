-- Business operational lifecycle: suspend / deactivate / soft delete (audit-friendly).
CREATE TYPE "BusinessOperationalStatus" AS ENUM ('active', 'suspended', 'inactive');

ALTER TABLE "businesses"
  ADD COLUMN "operational_status" "BusinessOperationalStatus" NOT NULL DEFAULT 'active',
  ADD COLUMN "operational_status_changed_at" TIMESTAMP(3),
  ADD COLUMN "operational_review_history" JSONB,
  ADD COLUMN "deleted_at" TIMESTAMP(3);

CREATE INDEX "businesses_operational_status_idx" ON "businesses"("operational_status");
CREATE INDEX "businesses_deleted_at_idx" ON "businesses"("deleted_at");

-- Align legacy suspended filter (owner is_active = false) with operational_status where onboarding was approved.
UPDATE "businesses" b
SET
  "operational_status" = 'suspended',
  "operational_status_changed_at" = NOW()
FROM "User" u
WHERE u.id = b.user_id
  AND u.is_active = false
  AND b.onboarding_verification_status = 'approved'
  AND b.deleted_at IS NULL;
