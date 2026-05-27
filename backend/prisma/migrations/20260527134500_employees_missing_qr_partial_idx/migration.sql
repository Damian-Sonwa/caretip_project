-- Speed up business dashboard "missing QR" roster pulse.
-- Supports: WHERE business_id = ? AND (slug IS NULL OR slug = '')
CREATE INDEX IF NOT EXISTS "employees_business_id_missing_qr_idx"
  ON "employees" ("business_id")
  WHERE "slug" IS NULL OR "slug" = '';

