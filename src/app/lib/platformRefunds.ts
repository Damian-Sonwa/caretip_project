import type { GlobalTransactionRow } from "./api";

export type RefundRecord = {
  refundId: string;
  originalTransactionId: string;
  businessName: string;
  employeeName: string;
  refundAmountEur: number;
  originalAmountEur: number;
  reason: string;
  status: string;
  requestedAt: string;
  processedAt: string | null;
  paymentProvider: string;
  stripePaymentIntentId: string | null;
  source: GlobalTransactionRow;
};

export function isRefundCandidate(row: GlobalTransactionRow): boolean {
  return row.tipStatus === "failed";
}

export function mapRefundRow(row: GlobalTransactionRow): RefundRecord {
  const reason =
    row.payoutStatus === "failed"
      ? "payout_failed"
      : row.payoutStatus === "not_applicable"
        ? "payment_reversed"
        : "chargeback_or_dispute";
  const status =
    row.payoutStatus === "pending"
      ? "pending"
      : row.payoutStatus === "failed"
        ? "failed"
        : "processed";

  return {
    refundId: `RF-${row.id.replace(/-/g, "").slice(-8).toUpperCase()}`,
    originalTransactionId: row.id,
    businessName: row.businessName,
    employeeName: row.employeeName,
    refundAmountEur: row.amountEur,
    originalAmountEur: row.amountEur,
    reason,
    status,
    requestedAt: row.createdAt,
    processedAt: status === "processed" || status === "failed" ? row.createdAt : null,
    paymentProvider: row.stripePaymentIntentId ? "Stripe" : "—",
    stripePaymentIntentId: row.stripePaymentIntentId,
    source: row,
  };
}
