-- Expand employee goals into multi-row CRUD with archive support.
-- Note: Existing table name is `employee_goals`.

-- 1) Create enum for status (if not exists).
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'EmployeeGoalStatus') THEN
    CREATE TYPE "EmployeeGoalStatus" AS ENUM ('active', 'archived');
  END IF;
END$$;

-- 2) Drop unique constraint on employee_id (allows multiple goals per employee).
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'employee_goals'::regclass
      AND contype = 'u'
  LOOP
    -- Drop the unique constraint that targets employee_id if present.
    IF EXISTS (
      SELECT 1
      FROM pg_constraint pc
      JOIN pg_attribute pa ON pa.attrelid = pc.conrelid
      JOIN unnest(pc.conkey) WITH ORDINALITY ck(attnum, ord) ON true
      WHERE pc.conname = c.conname
        AND pa.attnum = ck.attnum
        AND pa.attname = 'employee_id'
    ) THEN
      EXECUTE format('ALTER TABLE "employee_goals" DROP CONSTRAINT %I', c.conname);
    END IF;
  END LOOP;
END$$;

-- 3) Add new columns.
ALTER TABLE "employee_goals"
  ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT 'Tip goal',
  ADD COLUMN IF NOT EXISTS "status" "EmployeeGoalStatus" NOT NULL DEFAULT 'active';

-- 4) Indexes for employeeId/status filtering.
CREATE INDEX IF NOT EXISTS "employee_goals_employee_id_idx" ON "employee_goals" ("employee_id");
CREATE INDEX IF NOT EXISTS "employee_goals_employee_id_status_idx" ON "employee_goals" ("employee_id", "status");

