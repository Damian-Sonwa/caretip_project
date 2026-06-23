-- Phase B.2.1a — Premium branding fields on businesses
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "banner_image_path" TEXT;
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "brand_primary_color" VARCHAR(7) DEFAULT '#EB992C';
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "brand_secondary_color" VARCHAR(7) DEFAULT '#000000';
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "welcome_message" VARCHAR(120);
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "thank_you_message" VARCHAR(250);
