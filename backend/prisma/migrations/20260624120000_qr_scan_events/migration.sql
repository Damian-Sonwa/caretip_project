-- Sprint 4A: QR scan event persistence + funnel foundation

CREATE TABLE "qr_scan_events" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "location_id" TEXT,
    "table_id" TEXT,
    "qr_slug" VARCHAR(128),
    "scan_type" VARCHAR(32) NOT NULL,
    "entry_path" VARCHAR(512) NOT NULL,
    "user_agent" VARCHAR(512),
    "device_type" VARCHAR(32) NOT NULL,
    "country" VARCHAR(64),
    "city" VARCHAR(128),
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" VARCHAR(64) NOT NULL,
    "dedupe_key" VARCHAR(191) NOT NULL,

    CONSTRAINT "qr_scan_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "qr_funnel_events" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "session_id" VARCHAR(64) NOT NULL,
    "event_type" VARCHAR(32) NOT NULL,
    "employee_id" TEXT,
    "location_id" TEXT,
    "table_id" TEXT,
    "transaction_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qr_funnel_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "qr_scan_events_business_id_scanned_at_idx" ON "qr_scan_events"("business_id", "scanned_at" DESC);
CREATE INDEX "qr_scan_events_employee_id_scanned_at_idx" ON "qr_scan_events"("employee_id", "scanned_at" DESC);
CREATE INDEX "qr_scan_events_location_id_scanned_at_idx" ON "qr_scan_events"("location_id", "scanned_at" DESC);
CREATE INDEX "qr_scan_events_table_id_scanned_at_idx" ON "qr_scan_events"("table_id", "scanned_at" DESC);

CREATE INDEX "qr_funnel_events_business_id_created_at_idx" ON "qr_funnel_events"("business_id", "created_at" DESC);
CREATE INDEX "qr_funnel_events_session_id_created_at_idx" ON "qr_funnel_events"("session_id", "created_at" DESC);

ALTER TABLE "qr_scan_events" ADD CONSTRAINT "qr_scan_events_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "qr_scan_events" ADD CONSTRAINT "qr_scan_events_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "qr_scan_events" ADD CONSTRAINT "qr_scan_events_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "qr_scan_events" ADD CONSTRAINT "qr_scan_events_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "venue_tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "qr_funnel_events" ADD CONSTRAINT "qr_funnel_events_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
