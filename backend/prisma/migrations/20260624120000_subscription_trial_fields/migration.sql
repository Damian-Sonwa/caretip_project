-- Trial subscription fields (backward compatible — all nullable or defaulted)

ALTER TABLE "subscriptions" ADD COLUMN "is_trial" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "subscriptions" ADD COLUMN "trial_reminder_sent" JSONB;
ALTER TABLE "subscriptions" ADD COLUMN "trial_expired_at" TIMESTAMP(3);
