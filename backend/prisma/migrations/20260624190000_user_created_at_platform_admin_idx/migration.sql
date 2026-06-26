-- Platform admin analytics: user growth buckets by created_at.

CREATE INDEX IF NOT EXISTS "User_created_at_idx"
  ON "User" ("created_at" DESC);
