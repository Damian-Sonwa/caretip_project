-- Add user_settings table + 2FA fields (safe, non-destructive)

-- 2FA fields on User
ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "two_factor_enabled" BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "two_factor_secret" TEXT;

ALTER TABLE "User"
  ADD COLUMN IF NOT EXISTS "two_factor_temp_secret" TEXT;

-- Preferences table (one row per user)
CREATE TABLE IF NOT EXISTS "user_settings" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "tip_received_notifications" BOOLEAN NOT NULL DEFAULT TRUE,
  "summary_emails" BOOLEAN NOT NULL DEFAULT FALSE,
  "system_alerts" BOOLEAN NOT NULL DEFAULT TRUE,
  "notify_new_login" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "user_settings_user_id_key" UNIQUE ("user_id"),
  CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Keep updated_at current (Supabase does not auto-update this column)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'user_settings_set_updated_at'
  ) THEN
    CREATE OR REPLACE FUNCTION user_settings_set_updated_at_fn()
    RETURNS TRIGGER AS $fn$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $fn$ LANGUAGE plpgsql;

    CREATE TRIGGER user_settings_set_updated_at
    BEFORE UPDATE ON "user_settings"
    FOR EACH ROW
    EXECUTE FUNCTION user_settings_set_updated_at_fn();
  END IF;
END $$;

