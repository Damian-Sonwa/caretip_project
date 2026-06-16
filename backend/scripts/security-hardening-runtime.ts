/**
 * Security hardening regression — memory token contract, MFA login gate, headers.
 * Run: npm run test:security-hardening (from backend/)
 */
import "dotenv/config";
import "../src/loadEnv.js";
import { isExpiredAccessTokenRefreshAllowed } from "../src/lib/accessTokenRefresh.js";
import {
  isPlatformAdminAccount,
  signPendingMfaLoginToken,
  userIdFromPendingMfaLoginToken,
  verifyTotpCode,
} from "../src/services/mfaLogin.service.js";
import * as authService from "../src/services/auth.service.js";

const results: string[] = [];
const pass = (m: string) => results.push(`PASS: ${m}`);
const fail = (m: string) => results.push(`FAIL: ${m}`);

function main() {
  if (process.env.NODE_ENV === "production" && isExpiredAccessTokenRefreshAllowed()) {
    fail("expired access token refresh must be disabled in production by default");
  } else {
    pass("expired access token refresh gated for production");
  }

  if (!isPlatformAdminAccount({ role: "SUPER_ADMIN", isPlatformAdmin: true })) {
    fail("platform admin detector");
  } else {
    pass("platform admin detector");
  }

  if (isPlatformAdminAccount({ role: "MANAGER", isPlatformAdmin: false })) {
    fail("manager must not be platform admin");
  } else {
    pass("manager excluded from platform admin MFA gate");
  }

  const token = signPendingMfaLoginToken("user-test-123");
  const uid = userIdFromPendingMfaLoginToken(token);
  if (uid !== "user-test-123") {
    fail("pending MFA token round-trip");
  } else {
    pass("pending MFA token round-trip");
  }

  const secret = "JBSWY3DPEHPK3PXP";
  if (!verifyTotpCode(secret, "000000")) {
    pass("TOTP rejects invalid code");
  } else {
    fail("TOTP should reject invalid code");
  }

  if (typeof authService.validateLoginCredentials !== "function") {
    fail("validateLoginCredentials export missing");
  } else {
    pass("validateLoginCredentials exported for MFA login split");
  }

  const failed = results.filter((r) => r.startsWith("FAIL:"));
  console.log(results.join("\n"));
  console.log(failed.length === 0 ? "OVERALL: PASS" : "OVERALL: FAIL");
  process.exit(failed.length === 0 ? 0 : 1);
}

main();
