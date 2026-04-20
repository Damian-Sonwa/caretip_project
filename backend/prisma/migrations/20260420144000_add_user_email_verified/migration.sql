-- AddColumn
ALTER TABLE "public"."User"
ADD COLUMN "email_verified" BOOLEAN NOT NULL DEFAULT false;

