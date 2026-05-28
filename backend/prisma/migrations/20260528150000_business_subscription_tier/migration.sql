-- CreateEnum
CREATE TYPE "BusinessSubscriptionTier" AS ENUM ('basic', 'premium', 'enterprise');

-- AlterTable: default premium preserves current tenant behavior until billing assigns tiers.
ALTER TABLE "businesses" ADD COLUMN "subscription_tier" "BusinessSubscriptionTier" NOT NULL DEFAULT 'premium';
