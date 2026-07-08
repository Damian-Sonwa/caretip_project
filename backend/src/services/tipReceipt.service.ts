import { randomInt } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";

const RECEIPT_PREFIX = "CT";
const RANDOM_SEGMENT_LENGTH = 8;
const RECEIPT_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const MAX_ALLOCATION_ATTEMPTS = 16;

/** Legacy sequential format (CT-2026-00001) — still valid for existing receipts. */
const LEGACY_RECEIPT_PATTERN = /^CT-\d{4}-\d+$/;

function twoDigitYear(referenceDate: Date): string {
  return String(referenceDate.getUTCFullYear() % 100).padStart(2, "0");
}

function randomReceiptSegment(length: number): string {
  let segment = "";
  for (let i = 0; i < length; i++) {
    segment += RECEIPT_ALPHABET[randomInt(RECEIPT_ALPHABET.length)]!;
  }
  return segment;
}

/** Format a secure CareTip receipt number: CT-26-A8K4P9X2 */
export function formatSecureTipReceiptNumber(referenceDate: Date = new Date()): string {
  return `${RECEIPT_PREFIX}-${twoDigitYear(referenceDate)}-${randomReceiptSegment(RANDOM_SEGMENT_LENGTH)}`;
}

export function isLegacyTipReceiptNumber(receiptNumber: string): boolean {
  return LEGACY_RECEIPT_PATTERN.test(receiptNumber.trim());
}

async function receiptNumberExists(
  tx: Prisma.TransactionClient,
  receiptNumber: string,
): Promise<boolean> {
  const row = await tx.transaction.findFirst({
    where: { receiptNumber },
    select: { id: true },
  });
  return row != null;
}

/**
 * Allocate a cryptographically random receipt number and verify uniqueness before use.
 * Collision retries are server-side only — never expose sequential or predictable IDs.
 */
export async function allocateTipReceiptNumber(
  tx: Prisma.TransactionClient,
  referenceDate: Date = new Date(),
): Promise<string> {
  for (let attempt = 0; attempt < MAX_ALLOCATION_ATTEMPTS; attempt++) {
    const candidate = formatSecureTipReceiptNumber(referenceDate);
    const taken = await receiptNumberExists(tx, candidate);
    if (!taken) {
      return candidate;
    }
  }
  throw new Error("Failed to allocate a unique tip receipt number");
}

/**
 * Ensure a successful transaction has a persisted receipt number.
 * Idempotent — returns the existing number when already set (including legacy formats).
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

    for (let attempt = 0; attempt < MAX_ALLOCATION_ATTEMPTS; attempt++) {
      const receiptNumber = await allocateTipReceiptNumber(tx, locked.createdAt);
      try {
        await tx.transaction.update({
          where: { id: transactionId },
          data: { receiptNumber },
        });
        return receiptNumber;
      } catch (err) {
        const code = (err as { code?: string })?.code;
        if (code !== "P2002") {
          throw err;
        }
        const retried = await tx.transaction.findUnique({
          where: { id: transactionId },
          select: { receiptNumber: true },
        });
        if (retried?.receiptNumber?.trim()) {
          return retried.receiptNumber.trim();
        }
      }
    }
    throw new Error("Failed to persist a unique tip receipt number");
  });
}
