-- Sprint 4.1 — atomic QR scan dedupe via UNIQUE(dedupe_key)

-- Remove legacy duplicate rows (keep earliest scan per dedupe_key)
DELETE FROM "qr_scan_events" a
USING "qr_scan_events" b
WHERE a."dedupe_key" = b."dedupe_key"
  AND (a."scanned_at" > b."scanned_at" OR (a."scanned_at" = b."scanned_at" AND a."id" > b."id"));

CREATE UNIQUE INDEX "qr_scan_events_dedupe_key_key" ON "qr_scan_events"("dedupe_key");
