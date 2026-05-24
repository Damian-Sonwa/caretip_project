-- Manual repair when notifications/announcements APIs return 500 (missing tables).
-- Run in Supabase SQL Editor, then restart the Render API (or wait for redeploy).
-- Same DDL as migration 20260525180000_notification_inbox_tables.

DO $$ BEGIN
  CREATE TYPE "public"."NotificationPriority" AS ENUM ('normal', 'high');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "notifications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" VARCHAR(64) NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "priority" "public"."NotificationPriority" NOT NULL DEFAULT 'normal',
    "channels" TEXT[] NOT NULL DEFAULT ARRAY['in_app']::TEXT[],
    "read_at" TIMESTAMP(3),
    "dedupe_key" VARCHAR(191),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "notifications_user_id_created_at_idx"
  ON "notifications"("user_id", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "notifications_user_id_read_at_idx"
  ON "notifications"("user_id", "read_at");
CREATE UNIQUE INDEX IF NOT EXISTS "notifications_user_id_dedupe_key_key"
  ON "notifications"("user_id", "dedupe_key");

CREATE TABLE IF NOT EXISTS "announcements" (
    "id" TEXT NOT NULL,
    "created_by_id" TEXT NOT NULL,
    "title" VARCHAR(256) NOT NULL,
    "message" TEXT NOT NULL,
    "audience" VARCHAR(32) NOT NULL,
    "priority" "public"."NotificationPriority" NOT NULL DEFAULT 'normal',
    "channels" TEXT[] NOT NULL DEFAULT ARRAY['in_app', 'push']::TEXT[],
    "url" VARCHAR(512),
    "recipient_count" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "announcements_created_at_idx"
  ON "announcements"("created_at" DESC);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_id_fkey') THEN
    ALTER TABLE "notifications"
      ADD CONSTRAINT "notifications_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'announcements_created_by_id_fkey') THEN
    ALTER TABLE "announcements"
      ADD CONSTRAINT "announcements_created_by_id_fkey"
      FOREIGN KEY ("created_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
