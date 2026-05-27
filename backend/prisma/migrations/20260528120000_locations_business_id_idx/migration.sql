-- Speeds platform admin business list location subqueries and business-scoped location lookups.
CREATE INDEX IF NOT EXISTS "locations_business_id_idx" ON "locations"("business_id");
