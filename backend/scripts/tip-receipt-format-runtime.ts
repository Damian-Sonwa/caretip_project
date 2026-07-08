/**
 * Tip receipt format regression — secure random IDs, no sequential allocator.
 * Run: npm run test:tip-receipt-format (from backend/)
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  formatSecureTipReceiptNumber,
  isLegacyTipReceiptNumber,
} from "../src/services/tipReceipt.service.js";

const SECURE_RECEIPT_PATTERN = /^CT-\d{2}-[A-Z0-9]{8}$/;

const results: string[] = [];
const pass = (m: string) => results.push(`PASS: ${m}`);
const fail = (m: string) => results.push(`FAIL: ${m}`);

function main() {
  const src = readFileSync(join(process.cwd(), "src/services/tipReceipt.service.ts"), "utf8");

  const banned = [
    "tipReceiptSequence",
    "formatTipReceiptNumber",
    "nextReceiptSequence",
    'padStart(5, "0")',
    "lastNumber",
  ];
  const found = banned.filter((token) => src.includes(token));
  if (found.length) {
    fail(`sequential allocator still referenced: ${found.join(", ")}`);
  } else {
    pass("tipReceipt.service.ts has no active sequential allocator references");
  }

  if (!src.includes("randomInt") || !src.includes("node:crypto")) {
    fail("tipReceipt.service.ts must use crypto.randomInt");
  } else {
    pass("crypto-secure random generation present");
  }

  const referenceDate = new Date("2026-07-08T12:00:00.000Z");
  const samples = Array.from({ length: 12 }, () => formatSecureTipReceiptNumber(referenceDate));

  for (const sample of samples) {
    if (!SECURE_RECEIPT_PATTERN.test(sample)) {
      fail(`generated receipt does not match secure format: ${sample}`);
    }
  }
  if (samples.every((s) => SECURE_RECEIPT_PATTERN.test(s))) {
    pass(`generated receipts match CT-YY-RANDOM8 (e.g. ${samples[0]})`);
  }

  const unique = new Set(samples);
  if (unique.size < samples.length - 1) {
    fail("expected high entropy across generated samples");
  } else {
    pass("generated samples are non-identical");
  }

  for (const sample of samples) {
    if (isLegacyTipReceiptNumber(sample)) {
      fail(`secure receipt must not match legacy pattern: ${sample}`);
    }
  }
  pass("new format does not classify as legacy sequential");

  if (!isLegacyTipReceiptNumber("CT-2026-00001")) {
    fail("legacy receipt CT-2026-00001 must remain recognized");
  } else {
    pass("legacy receipt CT-2026-00001 remains valid");
  }

  if (isLegacyTipReceiptNumber("CT-26-A8K4P9X2")) {
    fail("secure example CT-26-A8K4P9X2 must not be classified as legacy");
  } else {
    pass("secure example CT-26-A8K4P9X2 is not legacy sequential");
  }

  const failures = results.filter((r) => r.startsWith("FAIL:"));
  for (const line of results) {
    console.log(line);
  }
  if (failures.length) {
    console.error(`\n${failures.length} failure(s)`);
    process.exit(1);
  }
  console.log(`\nAll ${results.length} checks passed.`);
}

main();
