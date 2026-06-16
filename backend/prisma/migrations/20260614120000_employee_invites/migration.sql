-- Employee invite audit + redemption history (multi-use codes preserved).

CREATE TYPE "public"."EmployeeInviteStatus" AS ENUM ('active', 'expired', 'revoked');

CREATE TABLE "public"."employee_invites" (
    "id" TEXT NOT NULL,
    "invite_code" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "created_by_user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "status" "public"."EmployeeInviteStatus" NOT NULL DEFAULT 'active',

    CONSTRAINT "employee_invites_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "public"."employee_invite_redemptions" (
    "id" TEXT NOT NULL,
    "invite_id" TEXT NOT NULL,
    "redeemed_by_user_id" TEXT NOT NULL,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "employee_id" TEXT NOT NULL,
    "invitee_email" TEXT NOT NULL,
    "invitee_name" TEXT NOT NULL,

    CONSTRAINT "employee_invite_redemptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "employee_invites_invite_code_key" ON "public"."employee_invites"("invite_code");
CREATE INDEX "employee_invites_business_id_status_idx" ON "public"."employee_invites"("business_id", "status");
CREATE INDEX "employee_invites_expires_at_idx" ON "public"."employee_invites"("expires_at");

CREATE UNIQUE INDEX "employee_invite_redemptions_invite_id_redeemed_by_user_id_key"
  ON "public"."employee_invite_redemptions"("invite_id", "redeemed_by_user_id");
CREATE INDEX "employee_invite_redemptions_invite_id_redeemed_at_idx"
  ON "public"."employee_invite_redemptions"("invite_id", "redeemed_at");
CREATE INDEX "employee_invite_redemptions_redeemed_by_user_id_idx"
  ON "public"."employee_invite_redemptions"("redeemed_by_user_id");

ALTER TABLE "public"."employee_invites"
  ADD CONSTRAINT "employee_invites_business_id_fkey"
  FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."employee_invites"
  ADD CONSTRAINT "employee_invites_created_by_user_id_fkey"
  FOREIGN KEY ("created_by_user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."employee_invite_redemptions"
  ADD CONSTRAINT "employee_invite_redemptions_invite_id_fkey"
  FOREIGN KEY ("invite_id") REFERENCES "public"."employee_invites"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."employee_invite_redemptions"
  ADD CONSTRAINT "employee_invite_redemptions_redeemed_by_user_id_fkey"
  FOREIGN KEY ("redeemed_by_user_id") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."employee_invite_redemptions"
  ADD CONSTRAINT "employee_invite_redemptions_employee_id_fkey"
  FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill active invites from legacy business.invite_code columns.
INSERT INTO "public"."employee_invites" (
  "id",
  "invite_code",
  "business_id",
  "created_by_user_id",
  "created_at",
  "expires_at",
  "status"
)
SELECT
  'mig_' || b."id",
  b."invite_code",
  b."id",
  b."user_id",
  CURRENT_TIMESTAMP,
  b."invite_code_expires_at",
  CASE
    WHEN b."invite_code_expires_at" > CURRENT_TIMESTAMP THEN 'active'::"public"."EmployeeInviteStatus"
    ELSE 'expired'::"public"."EmployeeInviteStatus"
  END
FROM "public"."businesses" b
WHERE b."invite_code" IS NOT NULL
  AND b."invite_code_expires_at" IS NOT NULL
ON CONFLICT ("invite_code") DO NOTHING;
