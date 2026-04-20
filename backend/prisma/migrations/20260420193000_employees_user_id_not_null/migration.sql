-- Every employee must reference an auth account (`User` / public."User").
-- If this fails, you still have rows with NULL user_id: from `backend/` run
--   npm run db:backfill-pending-employee-users
-- then re-apply migrations.

ALTER TABLE "public"."employees" ALTER COLUMN "user_id" SET NOT NULL;
