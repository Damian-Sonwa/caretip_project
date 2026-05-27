-- Active goals list for business dashboard (status filter + updated_at sort).
CREATE INDEX IF NOT EXISTS "employee_goals_active_updated_idx"
  ON "employee_goals" ("status", "updated_at" DESC)
  WHERE status = 'active';
