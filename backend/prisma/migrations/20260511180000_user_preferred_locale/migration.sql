-- App / email language preference (ISO-style: en, de). Null = infer from Accept-Language on next email.
ALTER TABLE "User" ADD COLUMN "preferred_locale" TEXT;
