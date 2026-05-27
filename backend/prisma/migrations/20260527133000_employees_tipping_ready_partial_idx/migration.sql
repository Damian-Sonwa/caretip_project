-- Speed up business dashboard "tipping ready" roster pulse.
-- This supports: WHERE business_id = ? AND is_active = true AND activation_status = 'active'
-- Note: email_verified is on "User" and is checked via EXISTS in SQL.
CREATE INDEX IF NOT EXISTS "employees_business_id_active_activation_active_idx"
  ON "employees" ("business_id")
  WHERE "is_active" = true AND "activation_status" = 'active';

