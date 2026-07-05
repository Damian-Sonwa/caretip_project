-- CareTip customer receipt numbers (CT-YYYY-NNNNN) stored on successful tip transactions.

CREATE TABLE "tip_receipt_sequences" (
    "year" INTEGER NOT NULL,
    "last_number" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "tip_receipt_sequences_pkey" PRIMARY KEY ("year")
);

ALTER TABLE "tips" ADD COLUMN "receipt_number" TEXT;

CREATE UNIQUE INDEX "tips_receipt_number_key" ON "tips"("receipt_number");
