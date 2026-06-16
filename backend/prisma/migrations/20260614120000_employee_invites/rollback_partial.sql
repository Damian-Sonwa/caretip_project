-- Run in Supabase SQL Editor if migrate deploy failed mid-way (P3018 on employee_invites).
-- Then: npm run db:migrate:resolve -- --rolled-back 20260614120000_employee_invites
-- Then: npm run db:migrate:deploy

DROP TABLE IF EXISTS "public"."employee_invite_redemptions";
DROP TABLE IF EXISTS "public"."employee_invites";
DROP TYPE IF EXISTS "public"."EmployeeInviteStatus";
