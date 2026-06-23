-- Phase B.2 — Premium Branding v2 (QR templates + display identity)
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "brand_display_name" VARCHAR(80);
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "brand_tagline" VARCHAR(120);
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "qr_template" VARCHAR(32) NOT NULL DEFAULT 'classic';
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "qr_border_style" VARCHAR(32) NOT NULL DEFAULT 'rounded';
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "qr_shape" VARCHAR(32) NOT NULL DEFAULT 'square';
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "qr_accent_color" VARCHAR(7);
ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "qr_background_color" VARCHAR(7) DEFAULT '#FFFFFF';
