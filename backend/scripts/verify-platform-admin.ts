/**
 * Check that a user exists for the same DB the API uses and optionally test the password.
 * Usage (from backend/):
 *   npx tsx scripts/verify-platform-admin.ts you@example.com
 *   npx tsx scripts/verify-platform-admin.ts you@example.com "your-password"
 */
import "dotenv/config";
import "../src/loadEnv.js";
import bcrypt from "bcrypt";
import { prisma } from "../src/prisma.js";
import { getDatabaseUrlForPrisma } from "../src/databaseUrl.js";

const email = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3];

function safeDbHint(): string {
  try {
    const u = new URL(getDatabaseUrlForPrisma().replace(/^postgresql:\/\//i, "http://"));
    return `${u.hostname}${u.port ? `:${u.port}` : ""}`;
  } catch {
    return "(could not parse DATABASE_URL)";
  }
}

async function main() {
  if (!email) {
    console.error("Usage: npx tsx scripts/verify-platform-admin.ts <email> [password-to-test]");
    process.exit(1);
  }

  console.log("DATABASE_URL host (this process):", safeDbHint());
  console.log("---");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(
      "NOT FOUND: No user with this email in the database this API connects to.\n" +
        "If you see a row in Supabase but get this, DATABASE_URL likely points at another project or branch.\n" +
        "Note: backend/.env overrides repo root .env for duplicate keys — keep one DATABASE_URL or make them identical.",
    );
    process.exit(1);
  }

  console.log("User row:", {
    id: user.id,
    email: user.email,
    role: user.role,
    isPlatformAdmin: user.isPlatformAdmin,
    isActive: user.isActive,
    passwordHashLooksLikeBcrypt: user.passwordHash.startsWith("$2"),
  });

  if (user.role !== "SUPER_ADMIN" || !user.isPlatformAdmin) {
    console.error(
      "\nFIX: Platform admin login requires role SUPER_ADMIN and is_platform_admin true.\n" +
        "Run: npm run admin:create -- " +
        email +
        " 'your-new-password'",
    );
    process.exit(1);
  }

  if (!user.isActive) {
    console.error("\nFIX: is_active must be true for sign-in.");
    process.exit(1);
  }

  if (password !== undefined) {
    const ok = await bcrypt.compare(password, user.passwordHash);
    console.log("\nPassword matches bcrypt hash:", ok);
    if (!ok) {
      console.error(
        "The password you passed does not match the stored hash. Reset with:\n" +
          `  npm run admin:create -- ${email} 'your-new-password'`,
      );
      process.exit(1);
    }
  } else {
    console.log("\n(Pass a second argument to test password: npx tsx scripts/verify-platform-admin.ts <email> \"password\")");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
