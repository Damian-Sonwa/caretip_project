-- New enum label for invite signups awaiting email verification (see `EmployeeActivationStatus` in schema).
DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'EmployeeActivationStatus'
      AND e.enumlabel = 'pending_verification'
  ) THEN
    ALTER TYPE "EmployeeActivationStatus" ADD VALUE 'pending_verification';
  END IF;
END
$migration$;
