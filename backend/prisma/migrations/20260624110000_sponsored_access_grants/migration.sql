-- Sponsored Access grants (approval-based; independent of Stripe subscriptions)

CREATE TYPE "SponsoredAccessStatus" AS ENUM ('pending', 'active', 'revoked', 'expired');

CREATE TABLE "sponsored_access_grants" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "programme_key" TEXT NOT NULL,
    "status" "SponsoredAccessStatus" NOT NULL DEFAULT 'pending',
    "approved_at" TIMESTAMP(3),
    "approved_by_user_id" TEXT,
    "expires_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsored_access_grants_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "sponsored_access_grants_business_id_status_idx" ON "sponsored_access_grants"("business_id", "status");
CREATE INDEX "sponsored_access_grants_programme_key_status_idx" ON "sponsored_access_grants"("programme_key", "status");

ALTER TABLE "sponsored_access_grants" ADD CONSTRAINT "sponsored_access_grants_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sponsored_access_grants" ADD CONSTRAINT "sponsored_access_grants_approved_by_user_id_fkey" FOREIGN KEY ("approved_by_user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
