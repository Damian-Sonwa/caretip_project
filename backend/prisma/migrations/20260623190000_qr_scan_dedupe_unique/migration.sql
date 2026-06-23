-- Sprint 4.1 — atomic QR scan dedupe via UNIQUE(dedupe_key)
-- No-op on fresh installs (table created in 20260624120000_qr_scan_events).

DO $$
BEGIN
  IF to_regclass('public.qr_scan_events') IS NOT NULL THEN
    DELETE FROM "qr_scan_events" a
    USING "qr_scan_events" b
    WHERE a."dedupe_key" = b."dedupe_key"
      AND (
        a."scanned_at" > b."scanned_at"
        OR (a."scanned_at" = b."scanned_at" AND a."id" > b."id")
      );

    CREATE UNIQUE INDEX IF NOT EXISTS "qr_scan_events_dedupe_key_key"
      ON "qr_scan_events"("dedupe_key");
  END IF;
END $$;
