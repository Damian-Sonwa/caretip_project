import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";

const RECEIPT_PREFIX = "CT";

/** Format a CareTip receipt number: CT-2026-48291 */
export function formatTipReceiptNumber(year: number, sequence: number): string {
  return `${RECEIPT_PREFIX}-${year}-${String(sequence).padStart(5, "0")}`;
}

async function nextReceiptSequence(
  tx: Prisma.TransactionClient,
  year: number,
): Promise<number> {
  const row = await tx.tipReceiptSequence.upsert({
    where: { year },
    create: { year, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
    select: { lastNumber: true },
  });
  return row.lastNumber;
}

/** Allocate the next receipt number for the given calendar year (UTC). */
export async function allocateTipReceiptNumber(
  tx: Prisma.TransactionClient,
  referenceDate: Date = new Date(),
): Promise<string> {
  const year = referenceDate.getUTCFullYear();
  const sequence = await nextReceiptSequence(tx, year);
  return formatTipReceiptNumber(year, sequence);
}

/**
 * Ensure a successful transaction has a persisted receipt number.
 * Idempotent — returns the existing number when already set.
 */
export async function ensureTransactionReceiptNumber(transactionId: string): Promise<string | null> {
  const existing = await prisma.transaction.findUnique({
    where: { id: transactionId },
    select: { id: true, status: true, receiptNumber: true, createdAt: true },
  });
  if (!existing || existing.status !== "success") {
    return null;
  }
  if (existing.receiptNumber?.trim()) {
    return existing.receiptNumber.trim();
  }

  return prisma.$transaction(async (tx) => {
    const locked = await tx.transaction.findUnique({
      where: { id: transactionId },
      select: { id: true, status: true, receiptNumber: true, createdAt: true },
    });
    if (!locked || locked.status !== "success") {
      return null;
    }
    if (locked.receiptNumber?.trim()) {
      return locked.receiptNumber.trim();
    }

    const receiptNumber = await allocateTipReceiptNumber(tx, locked.createdAt);
    try {
      await tx.transaction.update({
        where: { id: transactionId },
        data: { receiptNumber },
      });
      return receiptNumber;
    } catch (err) {
      const code = (err as { code?: string })?.code;
      if (code === "P2002") {
        const retried = await tx.transaction.findUnique({
          where: { id: transactionId },
          select: { receiptNumber: true },
        });
        return retried?.receiptNumber?.trim() ?? receiptNumber;
      }
      throw err;
    }
  });
}
