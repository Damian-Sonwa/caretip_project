/**
 * Calls the same login logic as HTTP (Prisma + bcrypt + JWT).
 * Set in backend/.env: TEST_SIGNIN_EMAIL, TEST_SIGNIN_PASSWORD, optional TEST_SIGNIN_ROLE=manager|employee|super_admin
 * Run: npm run db:signin-smoke
 */
import "dotenv/config";
import "../src/loadEnv.js";
import { login } from "../src/services/auth.service.js";

async function main() {
  const email = process.env.TEST_SIGNIN_EMAIL?.trim();
  const password = process.env.TEST_SIGNIN_PASSWORD;
  if (!email || !password) {
    console.error("Set TEST_SIGNIN_EMAIL and TEST_SIGNIN_PASSWORD in backend/.env");
    process.exit(1);
  }

  try {
    const result = await login({ email, password });
    console.log("Sign-in smoke OK:", result.user.email, result.user.role, "token chars:", result.token.length);
  } catch (e) {
    console.error("Sign-in smoke failed:", e instanceof Error ? e.message : e);
    process.exit(1);
  }
}

void main();
