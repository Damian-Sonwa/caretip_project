-- Sprint 7B — feature utilization daily rollups
CREATE TABLE "feature_utilization_daily" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "feature_key" VARCHAR(48) NOT NULL,
    "day" DATE NOT NULL,
    "hit_count" INTEGER NOT NULL DEFAULT 1,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_utilization_daily_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "feature_utilization_daily_business_id_feature_key_day_key" ON "feature_utilization_daily"("business_id", "feature_key", "day");

CREATE INDEX "feature_utilization_daily_business_id_day_idx" ON "feature_utilization_daily"("business_id", "day");

ALTER TABLE "feature_utilization_daily" ADD CONSTRAINT "feature_utilization_daily_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
