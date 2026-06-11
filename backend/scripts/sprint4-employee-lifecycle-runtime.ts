/**
 * Sprint 4 — employee soft delete preserves transaction ledger.
 * Run: npm run test:sprint4-employee-lifecycle
 */
import "dotenv/config";
import "../src/loadEnv.js";
import bcrypt from "bcrypt";
import { prisma } from "../src/prisma.js";
import * as employeeService from "../src/services/employee.service.js";
import { assertEmployeeEligibleForTipPayment, TipPaymentEligibilityError } from "../src/services/tipPaymentEligibility.service.js";

const results: string[] = [];
const pass = (m: string) => results.push(`PASS: ${m}`);
const fail = (m: string) => results.push(`FAIL: ${m}`);

async function main() {
  const tag = Date.now();
  const passwordHash = await bcrypt.hash("TestPass1!", 10);
  const mgr = await prisma.user.create({
    data: {
      email: `sprint4-life-${tag}@caretip-test.local`,
      passwordHash,
      role: "MANAGER",
      emailVerified: true,
      business: {
        create: {
          name: "Lifecycle Test",
          slug: `life-${tag}`,
          verificationStatus: "verified",
        },
      },
    },
    include: { business: true },
  });
  const empUser = await prisma.user.create({
    data: {
      email: `sprint4-life-emp-${tag}@caretip-test.local`,
      passwordHash,
      role: "EMPLOYEE",
      emailVerified: true,
      employee: {
        create: {
          name: "Lifecycle Staff",
          jobTitle: "Bar",
          businessId: mgr.business!.id,
          isActive: true,
          activationStatus: "active",
        },
      },
    },
    include: { employee: true },
  });
  const empId = empUser.employee!.id;
  const bizId = mgr.business!.id;

  const tx = await prisma.transaction.create({
    data: {
      amount: 15,
      status: "success",
      employeeId: empId,
      businessId: bizId,
      stripePaymentIntentId: `pi_life_${tag}`,
    },
  });

  try {
    await employeeService.deleteEmployeeForBusiness(bizId, empId);
    pass("soft delete completes");

    const row = await prisma.employee.findUnique({ where: { id: empId } });
    if (row?.isDeleted && row.deletedAt) pass("isDeleted + deletedAt set");
    else fail("soft delete flags missing");

    const ledger = await prisma.transaction.findUnique({ where: { id: tx.id } });
    if (ledger?.status === "success") pass("transaction ledger preserved");
    else fail("transaction lost after soft delete");

    let blocked = false;
    try {
      await assertEmployeeEligibleForTipPayment(empId, bizId);
    } catch (e) {
      blocked = e instanceof TipPaymentEligibilityError;
    }
    if (blocked) pass("deleted employee blocked from new tips");
    else fail("deleted employee still eligible");

    const roster = await employeeService.getEmployeesByBusinessId(bizId);
    if (!roster.some((e) => e.id === empId)) pass("soft-deleted excluded from active roster");
    else fail("deleted employee still in roster");
  } finally {
    await prisma.transaction.deleteMany({ where: { businessId: bizId } });
    await prisma.employee.deleteMany({ where: { businessId: bizId } });
    await prisma.business.delete({ where: { id: bizId } }).catch(() => {});
    await prisma.user.deleteMany({ where: { id: { in: [mgr.id, empUser.id] } } });
  }

  const failed = results.filter((r) => r.startsWith("FAIL:"));
  console.log(results.join("\n"));
  console.log(failed.length === 0 ? "OVERALL: PASS" : "OVERALL: FAIL");
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
