/**
 * SQL injection payload smoke tests — service layer + optional HTTP against RUNTIME_API_BASE.
 * Run: npm run test:sql-injection-smoke (from backend/)
 */
import "dotenv/config";
import "../src/loadEnv.js";
import bcrypt from "bcrypt";
import { prisma } from "../src/prisma.js";
import * as authService from "../src/services/auth.service.js";
import { listGlobalTransactions } from "../src/services/platform.service.js";
import {
  listBusinessSupportTickets,
  listPlatformSupportTickets,
} from "../src/services/supportTicket.service.js";
import { listUserNotifications } from "../src/services/notifications/notificationInbox.service.js";
import { validateInviteCode } from "../src/services/business.service.js";
import { signAuthJwt } from "../src/services/auth.service.js";
import {
  escapeLikeContainsPattern,
  sanitizeLikeContainsSearch,
} from "../src/utils/likeSearch.js";

const API = (process.env.RUNTIME_API_BASE ?? "http://localhost:3001").replace(/\/$/, "");

export const SQLI_PAYLOADS = [
  "' OR 1=1--",
  '" OR 1=1--',
  "admin'--",
  "' UNION SELECT NULL--",
  "') OR ('1'='1",
] as const;

const DB_LEAK_RE =
  /syntax error at or near|invalid input syntax|SQLSTATE|P20\d{2}|prisma.*query|postgresql.*error|unterminated quoted string/i;

const results: string[] = [];
const pass = (m: string) => results.push(`PASS: ${m}`);
const fail = (m: string) => results.push(`FAIL: ${m}`);
const skip = (m: string) => results.push(`SKIP: ${m}`);

function assertNoDbLeak(context: string, err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  if (DB_LEAK_RE.test(msg)) {
    fail(`${context}: database error leaked — ${msg.slice(0, 120)}`);
    return false;
  }
  return true;
}

function assertResponseSafe(context: string, status: number, body: string): boolean {
  if (status >= 500) {
    fail(`${context}: unexpected ${status}`);
    return false;
  }
  if (DB_LEAK_RE.test(body)) {
    fail(`${context}: response body leaks DB/SQL details`);
    return false;
  }
  return true;
}

async function isDbReachable(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

async function isApiReachable(): Promise<boolean> {
  try {
    const res = await fetch(`${API}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

async function seedManager() {
  const tag = `sqli-mgr-${Date.now()}`;
  const passwordHash = await bcrypt.hash("TestPass1!", 10);
  const user = await prisma.user.create({
    data: {
      email: `${tag}@caretip-test.local`,
      passwordHash,
      role: "MANAGER",
      emailVerified: true,
      hasCompletedOnboarding: true,
      business: {
        create: {
          name: `${tag} Venue`,
          slug: `${tag}-venue`,
          verificationStatus: "verified",
        },
      },
    },
    include: { business: true },
  });
  return {
    userId: user.id,
    businessId: user.business!.id,
    token: signAuthJwt({
      userId: user.id,
      id: user.id,
      email: user.email,
      role: "MANAGER",
      roleLabel: "MANAGER",
    }),
    cleanup: async () => {
      await prisma.business.delete({ where: { id: user.business!.id } }).catch(() => {});
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    },
  };
}

async function seedPlatformAdmin() {
  const tag = `sqli-admin-${Date.now()}`;
  const passwordHash = await bcrypt.hash("TestPass1!", 10);
  const user = await prisma.user.create({
    data: {
      email: `${tag}@caretip-test.local`,
      passwordHash,
      role: "SUPER_ADMIN",
      isPlatformAdmin: true,
      emailVerified: true,
    },
  });
  return {
    userId: user.id,
    token: signAuthJwt({
      userId: user.id,
      id: user.id,
      email: user.email,
      role: "SUPER_ADMIN",
      roleLabel: "SUPER_ADMIN",
    }),
    cleanup: async () => {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    },
  };
}

async function testLikeSearchHardening(): Promise<void> {
  if (escapeLikeContainsPattern("50% off") === "50\\% off") {
    pass("likeSearch: escapes %");
  } else {
    fail("likeSearch: % escape");
  }
  if (escapeLikeContainsPattern("a_b") === "a\\_b") {
    pass("likeSearch: escapes _");
  } else {
    fail("likeSearch: _ escape");
  }
  if (sanitizeLikeContainsSearch("  x  ") === "x") {
    pass("likeSearch: trims search");
  } else {
    fail("likeSearch: trim");
  }
  if (sanitizeLikeContainsSearch("") === undefined) {
    pass("likeSearch: empty → undefined");
  } else {
    fail("likeSearch: empty");
  }
}

async function testLoginPayloads(): Promise<void> {
  for (const payload of SQLI_PAYLOADS) {
    try {
      await authService.login({ email: payload, password: payload });
      fail(`login payload did not reject: ${payload.slice(0, 20)}`);
    } catch (err) {
      if (!assertNoDbLeak(`login(${payload.slice(0, 12)}...)`, err)) continue;
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Invalid email or password") || msg.includes("EmailNotVerified")) {
        pass(`login rejects payload (${payload.slice(0, 14)}…)`);
      } else {
        pass(`login throws safe error for payload (${payload.slice(0, 14)}…)`);
      }
    }
  }
}

async function testSearchPayloads(adminUserId: string, managerUserId: string): Promise<void> {
  for (const payload of SQLI_PAYLOADS) {
    try {
      const tx = await listGlobalTransactions({ q: payload, take: 10, skip: 0 });
      if (!Array.isArray(tx.items)) {
        fail(`platform search invalid shape for payload`);
      } else if (tx.items.length > 100) {
        fail(`platform search suspicious expansion (${tx.items.length} rows)`);
      } else {
        pass(`platform search safe (${payload.slice(0, 12)}…)`);
      }
    } catch (err) {
      if (assertNoDbLeak("platform search", err)) {
        fail(`platform search threw: ${err instanceof Error ? err.message : err}`);
      }
    }

    try {
      const tickets = await listPlatformSupportTickets({ search: payload });
      if (!Array.isArray(tickets) || tickets.length > 200) {
        fail(`platform tickets search suspicious result`);
      } else {
        pass(`platform tickets search safe (${payload.slice(0, 12)}…)`);
      }
    } catch (err) {
      if (assertNoDbLeak("platform tickets search", err)) {
        fail(`platform tickets search threw`);
      }
    }

    try {
      const tickets = await listBusinessSupportTickets(managerUserId, { search: payload });
      if (!Array.isArray(tickets) || tickets.length > 200) {
        fail(`business tickets search suspicious result`);
      } else {
        pass(`business tickets search safe (${payload.slice(0, 12)}…)`);
      }
    } catch (err) {
      if (assertNoDbLeak("business tickets search", err)) {
        fail(`business tickets search threw`);
      }
    }

    try {
      const inbox = await listUserNotifications(adminUserId, { search: payload, limit: 20 });
      if (!Array.isArray(inbox.items) || inbox.items.length > 100) {
        fail(`notifications search suspicious result`);
      } else {
        pass(`notifications search safe (${payload.slice(0, 12)}…)`);
      }
    } catch (err) {
      if (assertNoDbLeak("notifications search", err)) {
        fail(`notifications search threw`);
      }
    }
  }
}

async function testPublicEndpoints(): Promise<void> {
  for (const payload of SQLI_PAYLOADS) {
    try {
      const r = await validateInviteCode(payload);
      if (r.ok) {
        fail(`invite validate must not succeed on SQLi payload`);
      } else {
        pass(`invite validate rejects payload (${payload.slice(0, 12)}…)`);
      }
    } catch (err) {
      if (assertNoDbLeak("invite validate", err)) {
        fail(`invite validate threw unexpectedly`);
      }
    }
  }
}

async function testHttpPayloads(managerToken: string, adminToken: string): Promise<void> {
  if (!(await isApiReachable())) {
    skip("HTTP smoke — API not reachable");
    return;
  }

  for (const payload of SQLI_PAYLOADS) {
    const loginRes = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: payload, password: "wrong" }),
    }).catch(() => null);
    if (!loginRes) {
      skip("HTTP login — fetch failed");
      break;
    }
    const loginBody = await loginRes.text();
    if (!assertResponseSafe("HTTP login", loginRes.status, loginBody)) continue;
    if (loginRes.status === 200 && loginBody.includes('"token"')) {
      fail("HTTP login returned token on SQLi payload");
    } else {
      pass(`HTTP login safe (${payload.slice(0, 12)}…)`);
    }

    const searchRes = await fetch(
      `${API}/api/platform/transactions?q=${encodeURIComponent(payload)}&take=10`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    const searchBody = await searchRes.text();
    if (assertResponseSafe("HTTP platform search", searchRes.status, searchBody)) {
      pass(`HTTP platform search safe (${payload.slice(0, 12)}…)`);
    }

    const tipsRes = await fetch(
      `${API}/api/tips/business?employeeId=${encodeURIComponent(payload)}&take=10`,
      { headers: { Authorization: `Bearer ${managerToken}` } },
    );
    const tipsBody = await tipsRes.text();
    if (assertResponseSafe("HTTP tips employeeId filter", tipsRes.status, tipsBody)) {
      pass(`HTTP tips filter safe (${payload.slice(0, 12)}…)`);
    }

    const ticketRes = await fetch(
      `${API}/api/business/support/tickets?search=${encodeURIComponent(payload)}`,
      { headers: { Authorization: `Bearer ${managerToken}` } },
    );
    const ticketBody = await ticketRes.text();
    if (assertResponseSafe("HTTP support tickets search", ticketRes.status, ticketBody)) {
      pass(`HTTP support search safe (${payload.slice(0, 12)}…)`);
    }

    const notifRes = await fetch(
      `${API}/api/me/notifications?q=${encodeURIComponent(payload)}`,
      { headers: { Authorization: `Bearer ${adminToken}` } },
    );
    const notifBody = await notifRes.text();
    if (assertResponseSafe("HTTP notifications search", notifRes.status, notifBody)) {
      pass(`HTTP notifications search safe (${payload.slice(0, 12)}…)`);
    }

    const inviteRes = await fetch(
      `${API}/api/business/invite/validate?code=${encodeURIComponent(payload)}`,
    );
    const inviteBody = await inviteRes.text();
    if (assertResponseSafe("HTTP invite validate", inviteRes.status, inviteBody)) {
      pass(`HTTP invite validate safe (${payload.slice(0, 12)}…)`);
    }

    const ctxRes = await fetch(
      `${API}/api/tipping-context/${encodeURIComponent(payload)}`,
    );
    const ctxBody = await ctxRes.text();
    if (assertResponseSafe("HTTP tipping-context slug", ctxRes.status, ctxBody)) {
      pass(`HTTP public tipping-context safe (${payload.slice(0, 12)}…)`);
    }

    const goalsRes = await fetch(`${API}/api/goals/${encodeURIComponent(payload)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    const goalsBody = await goalsRes.text();
    if (assertResponseSafe("HTTP goals id param", goalsRes.status, goalsBody)) {
      pass(`HTTP goals param safe (${payload.slice(0, 12)}…)`);
    }
  }
}

async function main(): Promise<void> {
  await testLikeSearchHardening();

  if (!(await isDbReachable())) {
    skip("Service-layer SQLi payloads — database not reachable");
    skip("HTTP SQLi payloads — requires database for tokens");
    printSummary();
    return;
  }

  let manager: Awaited<ReturnType<typeof seedManager>> | null = null;
  let admin: Awaited<ReturnType<typeof seedPlatformAdmin>> | null = null;

  try {
    await testLoginPayloads();
    await testPublicEndpoints();

    manager = await seedManager();
    admin = await seedPlatformAdmin();
    await testSearchPayloads(admin.userId, manager.userId);
    await testHttpPayloads(manager.token, admin.token);
  } finally {
    await manager?.cleanup();
    await admin?.cleanup();
  }

  printSummary();
}

function printSummary(): void {
  console.log("\n=== SQL injection payload smoke tests ===\n");
  for (const line of results) console.log(line);
  const failed = results.filter((r) => r.startsWith("FAIL:"));
  const passed = results.filter((r) => r.startsWith("PASS:"));
  const skipped = results.filter((r) => r.startsWith("SKIP:"));
  console.log(`\nSummary: ${passed.length} passed, ${failed.length} failed, ${skipped.length} skipped`);
  console.log(failed.length === 0 ? "OVERALL: PASS" : "OVERALL: FAIL");
  process.exit(failed.length === 0 ? 0 : 1);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
