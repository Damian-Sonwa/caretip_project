-- Sprint 8 performance indexes (idempotent).
-- Tips filtered by location/table in analytics drill-downs; QR scan trend aggregation.

CREATE INDEX IF NOT EXISTS "tips_business_id_location_id_created_at_idx"
  ON "tips" ("business_id", "location_id", "created_at" DESC)
  WHERE "location_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "tips_business_id_table_id_created_at_idx"
  ON "tips" ("business_id", "table_id", "created_at" DESC)
  WHERE "table_id" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "qr_scan_events_business_scanned_at_idx"
  ON "qr_scan_events" ("business_id", "scanned_at" DESC);
