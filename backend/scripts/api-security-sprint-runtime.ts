/**
 * API Security Hardening Sprint (M1–M5) regression checks.
 * Run: npm run test:api-security-sprint (from backend/)
 */
import "dotenv/config";
import "../src/loadEnv.js";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SERVICE_UNAVAILABLE_MESSAGE } from "../src/constants/serviceUnavailable.js";
import {
  publicDtoHasSensitiveFields,
  toPublicBusinessProfileDto,
} from "../src/services/businessProfile.dto.js";
import {
  businessIdFromPublicSocketRoomToken,
  signPublicSocketRoomToken,
} from "../src/services/publicSocketToken.service.js";
import { supportTicketHttpError } from "../src/utils/supportTicketErrors.js";
import { peekLimit, checkAndIncrementLimit } from "../src/utils/layeredRateLimit.js";
import { securityRateLimits } from "../src/config/securityRateLimit.config.js";

const results: string[] = [];
const pass = (m: string) => results.push(`PASS: ${m}`);
const fail = (m: string) => results.push(`FAIL: ${m}`);

function main() {
  const authSource = readFileSync(
    join(process.cwd(), "src/controllers/auth.controller.ts"),
    "utf8",
  );
  if (authSource.includes("prismaFailureClientMessage")) {
    fail("M1: prismaFailureClientMessage must be removed from auth.controller");
  } else {
    pass("M1: prismaFailureClientMessage removed");
  }
  if (!authSource.includes("SERVICE_UNAVAILABLE_MESSAGE")) {
    fail("M1: login must use SERVICE_UNAVAILABLE_MESSAGE");
  } else {
    pass("M1: SERVICE_UNAVAILABLE_MESSAGE wired in auth controller");
  }

  const publicDto = toPublicBusinessProfileDto({
    id: "biz-1",
    name: "Test Venue",
    slug: "test-venue",
    businessType: "Cafe",
    location: "Berlin",
    registeredAddress: "Secret St",
    verificationStatus: "verified",
    subscriptionTier: "premium",
    contactPhone: "+49123",
    website: "https://example.com",
    logoPath: null,
  });
  if (publicDtoHasSensitiveFields(publicDto as unknown as Record<string, unknown>)) {
    fail("M2: public DTO must not include manager-only fields");
  } else {
    pass("M2: public DTO excludes sensitive fields");
  }
  if (
    publicDto.businessId !== "biz-1" ||
    publicDto.businessName !== "Test Venue" ||
    publicDto.publicLocation !== "Berlin"
  ) {
    fail("M2: public DTO shape");
  } else {
    pass("M2: public DTO includes allowed fields");
  }

  if (securityRateLimits.changePassword.ip.max <= 0) {
    fail("M3: change-password rate limit config");
  } else {
    pass("M3: change-password limits configured");
  }
  if (securityRateLimits.mfaFailure.lock.maxFailures < 3) {
    fail("M3: MFA failure lock threshold too low");
  } else {
    pass("M3: MFA failure lock configured");
  }
  if (securityRateLimits.feedbackTip.ip.max <= 0) {
    fail("M3: feedback tip rate limit missing");
  } else {
    pass("M3: feedback tip limit configured");
  }

  const { token } = signPublicSocketRoomToken("biz-socket-1");
  const bid = businessIdFromPublicSocketRoomToken(token);
  if (bid !== "biz-socket-1") {
    fail("M4: public socket token round-trip");
  } else {
    pass("M4: public socket token round-trip");
  }
  if (businessIdFromPublicSocketRoomToken("not-a-jwt") !== null) {
    fail("M4: invalid socket token rejected");
  } else {
    pass("M4: invalid socket token rejected");
  }

  const emitterSource = readFileSync(join(process.cwd(), "src/socket/socketEmitters.ts"), "utf8");
  if (
    /io\.to\(`public:business:\$\{businessId\}`\)\.emit\("verification_updated"/.test(
      emitterSource,
    )
  ) {
    fail("M4: verification_updated must not emit to public rooms");
  } else {
    pass("M4: verification_updated removed from public rooms");
  }

  const supportErr = supportTicketHttpError(new Error("Prisma P2002 unique constraint on internal_table"), "fallback");
  if (supportErr.message.includes("Prisma") || supportErr.message.includes("internal_table")) {
    fail("M5: support ticket errors must not leak raw messages");
  } else {
    pass("M5: support ticket generic fallback");
  }
  const validationErr = supportTicketHttpError(new Error("Subject is required"), "fallback");
  if (validationErr.message !== "Subject is required") {
    fail("M5: allowlisted validation message");
  } else {
    pass("M5: allowlisted validation message preserved");
  }

  const indexSource = readFileSync(join(process.cwd(), "src/index.ts"), "utf8");
  if (!indexSource.includes('disable("x-powered-by")')) {
    fail("Extra: X-Powered-By not disabled");
  } else {
    pass("Extra: X-Powered-By disabled");
  }
  if (!indexSource.includes("authenticatedApiRateLimit")) {
    fail("Extra: authenticated API rate limit not mounted");
  } else {
    pass("Extra: authenticated API rate limit mounted");
  }

  checkAndIncrementLimit({ key: "test-mfa-peek", maxPerWindow: 2, windowMs: 60_000 });
  checkAndIncrementLimit({ key: "test-mfa-peek", maxPerWindow: 2, windowMs: 60_000 });
  const peekAfter = peekLimit({
    key: "test-mfa-peek",
    maxPerWindow: 2,
    windowMs: 60_000,
  });
  if (peekAfter.allowed) {
    fail("M3: peekLimit should detect exhausted bucket");
  } else {
    pass("M3: peekLimit detects lockout window");
  }

  const failed = results.filter((r) => r.startsWith("FAIL:"));
  console.log(results.join("\n"));
  console.log(failed.length === 0 ? "OVERALL: PASS" : "OVERALL: FAIL");
  process.exit(failed.length === 0 ? 0 : 1);
}

main();
