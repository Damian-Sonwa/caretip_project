-- FCM web push device tokens (idempotent — safe if a prior attempt failed partway)

CREATE TABLE IF NOT EXISTS "push_device_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'web',
    "user_agent" VARCHAR(512),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_device_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "push_device_tokens_token_key" ON "push_device_tokens"("token");

CREATE INDEX IF NOT EXISTS "push_device_tokens_user_id_idx" ON "push_device_tokens"("user_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'push_device_tokens_user_id_fkey'
  ) THEN
    ALTER TABLE "push_device_tokens"
      ADD CONSTRAINT "push_device_tokens_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
