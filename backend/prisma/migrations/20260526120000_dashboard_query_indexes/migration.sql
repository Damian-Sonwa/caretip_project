-- Dashboard + analytics query indexes (idempotent).
-- Targets: tips time-range scans, employee hero aggregates, auth refresh, notifications, roster sort.

-- Employee dashboard: period summary, analytics findMany, goal progress sums.
CREATE INDEX IF NOT EXISTS "tips_employee_id_status_created_at_idx"
  ON "tips" ("employee_id", "status", "created_at" DESC);

-- Business dashboard: period aggregates, groupBy employee, chart bucketing.
CREATE INDEX IF NOT EXISTS "tips_business_id_status_created_at_idx"
  ON "tips" ("business_id", "status", "created_at" DESC);

-- Employee hero: available balance (success + paid).
CREATE INDEX IF NOT EXISTS "tips_employee_id_status_payout_status_idx"
  ON "tips" ("employee_id", "status", "payout_status");

-- Superseded by tips_business_id_status_created_at_idx for dashboard paths.
DROP INDEX IF EXISTS "tips_business_id_status_idx";

-- Auth: revoke active refresh sessions per user.
CREATE INDEX IF NOT EXISTS "refresh_tokens_user_id_revoked_at_idx"
  ON "refresh_tokens" ("user_id", "revoked_at");

-- Notifications: unread count (read_at IS NULL).
CREATE INDEX IF NOT EXISTS "notifications_user_id_unread_idx"
  ON "notifications" ("user_id")
  WHERE "read_at" IS NULL;

-- Business dashboard: employee roster orderBy isActive desc, name asc.
CREATE INDEX IF NOT EXISTS "employees_business_id_active_name_idx"
  ON "employees" ("business_id", "is_active" DESC, "name" ASC);

-- Goals on business dashboard (replaces employee_id + status-only index).
CREATE INDEX IF NOT EXISTS "employee_goals_employee_status_updated_idx"
  ON "employee_goals" ("employee_id", "status", "updated_at" DESC);

DROP INDEX IF EXISTS "employee_goals_employee_id_status_idx";
