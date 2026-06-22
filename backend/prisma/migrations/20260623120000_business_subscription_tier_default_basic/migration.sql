-- Business creation policy: new rows default to basic when subscription_tier is omitted.
-- Does NOT update existing rows — stored subscription_tier values are unchanged.

ALTER TABLE "businesses" ALTER COLUMN "subscription_tier" SET DEFAULT 'basic';
