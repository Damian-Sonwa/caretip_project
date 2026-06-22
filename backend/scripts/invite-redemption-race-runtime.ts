/**
 * Invite redemption race regression (requires DATABASE_URL).
 * Run: npm run test:invite-redemption-race (backend)
 */
import "dotenv/config";
import "../src/loadEnv.js";
import bcrypt from "bcrypt";
import { prisma } from "../src/prisma.js";
import { createEmployeeInviteForManager, registerEmployeeWithInvite } from "../src/services/employeeInvite.service.js";

const TEST_PASSWORD = "RaceTest1!";

async function main() {
  const results: string[] = [];
  const pass = (msg: string) => results.push(`PASS: ${msg}`);
  const fail = (msg: string) => results.push(`FAIL: ${msg}`);
  const skip = (msg: string) => results.push(`SKIP: ${msg}`);

  if (!process.env.DATABASE_URL?.trim()) {
    skip("DATABASE_URL not set");
    console.log(results.join("\n"));
    return;
  }

  const stamp = Date.now();
  const managerEmail = `invite-race-mgr-${stamp}@caretip-test.local`;

  let businessId: string | null = null;
  let managerUserId: string | null = null;
  let inviteCode: string | null = null;
  let inviteId: string | null = null;

  try {
    const manager = await prisma.user.create({
      data: {
        email: managerEmail,
        passwordHash: await bcrypt.hash(TEST_PASSWORD, 10),
        role: "MANAGER",
        emailVerified: true,
        business: {
          create: {
            name: `Race Test Venue ${stamp}`,
            slug: `race-venue-${stamp}`,
            subscriptionTier: "premium",
          },
        },
      },
      include: { business: true },
    });
    managerUserId = manager.id;
    businessId = manager.business!.id;

    const invite = await createEmployeeInviteForManager(manager.id);
    inviteCode = invite.inviteCode;
    inviteId = invite.inviteId;

    const parallelCount = 5;
    const registrations = await Promise.allSettled(
      Array.from({ length: parallelCount }, (_, i) =>
        registerEmployeeWithInvite({
          inviteCode: inviteCode!,
          email: `race-emp-${stamp}-${i}@caretip-test.local`,
          name: `Race Employee ${i}`,
          passwordHash: bcrypt.hashSync(TEST_PASSWORD, 10),
          emailVerified: false,
          preferredLocale: "en",
          activationStatus: "pending_verification",
          registrationChannel: "password",
        }),
      ),
    );

    const fulfilled = registrations.filter((r) => r.status === "fulfilled").length;
    if (fulfilled !== parallelCount) {
      fail(`Expected ${parallelCount} parallel registrations, got ${fulfilled}`);
    } else {
      pass(`${parallelCount} parallel invite registrations succeeded`);
    }

    const redemptionRows = await prisma.employeeInviteRedemption.count({
      where: { inviteId: inviteId! },
    });
    if (redemptionRows !== parallelCount) {
      fail(`Expected ${parallelCount} redemption rows, found ${redemptionRows}`);
    } else {
      pass("Redemption rows match successful registrations");
    }

    const duplicateEmail = `race-dup-${stamp}@caretip-test.local`;
    const dupResults = await Promise.allSettled([
      registerEmployeeWithInvite({
        inviteCode: inviteCode!,
        email: duplicateEmail,
        name: "Dup A",
        passwordHash: bcrypt.hashSync(TEST_PASSWORD, 10),
        emailVerified: false,
        preferredLocale: "en",
        activationStatus: "pending_verification",
        registrationChannel: "password",
      }),
      registerEmployeeWithInvite({
        inviteCode: inviteCode!,
        email: duplicateEmail,
        name: "Dup B",
        passwordHash: bcrypt.hashSync(TEST_PASSWORD, 10),
        emailVerified: false,
        preferredLocale: "en",
        activationStatus: "pending_verification",
        registrationChannel: "password",
      }),
    ]);

    const dupSuccess = dupResults.filter((r) => r.status === "fulfilled").length;
    if (dupSuccess !== 1) {
      fail(`Duplicate email race: expected 1 success, got ${dupSuccess}`);
    } else {
      pass("Duplicate email concurrent registration — exactly one success");
    }

    const dupRedemptions = await prisma.employeeInviteRedemption.count({
      where: { inviteId: inviteId!, inviteeEmail: duplicateEmail },
    });
    if (dupRedemptions !== 1) {
      fail(`Duplicate email should produce 1 redemption row, found ${dupRedemptions}`);
    } else {
      pass("Duplicate email produces single redemption record");
    }

    const auditForInvite = await prisma.auditLog.count({
      where: {
        action: { in: ["employee_invite_redeemed", "employee_invite_redemption_observed"] },
        metadata: { contains: inviteId! },
      },
    });
    if (auditForInvite < parallelCount) {
      fail(`Expected audit logs for invite ${inviteId}, found ${auditForInvite}`);
    } else {
      pass("Audit log entries recorded for invite redemptions");
    }
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "P2021" || code === "P2022") {
      skip("employee_invites table missing — run migration 20260614120000_employee_invites");
      console.log("=== Invite Redemption Race Tests ===\n");
      for (const line of results) console.log(line);
      return;
    }
    throw err;
  } finally {
    if (managerUserId) {
      await prisma.user.delete({ where: { id: managerUserId } }).catch(() => {});
    }
  }

  console.log("=== Invite Redemption Race Tests ===\n");
  for (const line of results) console.log(line);
  const failures = results.filter((l) => l.startsWith("FAIL:"));
  if (failures.length > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
