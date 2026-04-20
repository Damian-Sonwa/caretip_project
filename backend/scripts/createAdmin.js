/**
 * Create or update a Super Admin user (role SUPER_ADMIN, isPlatformAdmin true, isActive true).
 * Does not use the public register API — run on a secure machine with DATABASE_URL set.
 *
 * Requirements:
 * - `ADMIN_SEED_SECRET` must be set in the environment (proves intentional, scripted access).
 * - In production (`NODE_ENV=production`), set `ALLOW_ADMIN_SEED_IN_PRODUCTION=true` or the script exits.
 * - By default only one SUPER_ADMIN may exist; set `ALLOW_MULTIPLE_SUPER_ADMINS=true` to allow more.
 *
 * Usage (from backend directory):
 *   node scripts/createAdmin.js <email> <password>
 *
 * Or with npm from repo root:
 *   cd backend && npm run admin:create -- admin@example.com 'your-secure-password'
 */
import "dotenv/config";
import "../src/loadEnv.js";
import bcrypt from "bcrypt";
import { prisma } from "../src/prisma.js";

const email = process.argv[2]?.trim().toLowerCase();
const password = process.argv[3];

const seedSecret = process.env.ADMIN_SEED_SECRET?.trim();
if (!seedSecret || seedSecret.length < 8) {
  console.error(
    "Refusing to run: set ADMIN_SEED_SECRET in your environment (at least 8 characters).",
  );
  console.error("Add it to backend/.env or export it before running this script.");
  process.exit(1);
}

if (process.env.NODE_ENV === "production" && process.env.ALLOW_ADMIN_SEED_IN_PRODUCTION !== "true") {
  console.error(
    "Refusing to run in production. Set ALLOW_ADMIN_SEED_IN_PRODUCTION=true only when you intentionally seed an admin on a server.",
  );
  process.exit(1);
}

if (!email || !password) {
  console.error("Usage: node scripts/createAdmin.js <email> <password>");
  process.exit(1);
}

async function main() {
  const allowMultiple = process.env.ALLOW_MULTIPLE_SUPER_ADMINS === "true";
  if (!allowMultiple) {
    const other = await prisma.user.findFirst({
      where: {
        role: "SUPER_ADMIN",
        email: { not: email },
      },
      select: { id: true, email: true },
    });
    if (other) {
      console.error(
        "Another SUPER_ADMIN already exists:",
        other.email,
        "— set ALLOW_MULTIPLE_SUPER_ADMINS=true to create additional platform admins.",
      );
      process.exit(1);
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: "SUPER_ADMIN",
      isPlatformAdmin: true,
      isActive: true,
      emailVerified: true,
    },
    create: {
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      isPlatformAdmin: true,
      isActive: true,
      emailVerified: true,
    },
  });
  console.log("Super Admin user saved:", email);
}

main()
  .catch((e) => {
    const msg = String(e?.message ?? e);
    if (
      msg.includes("invalid input value for enum") &&
      msg.includes("SUPER_ADMIN")
    ) {
      console.error(msg);
      console.error(
        "\nThe database Role enum is missing SUPER_ADMIN. Fix by applying migrations:\n" +
          "  cd backend && npm run db:migrate:deploy\n" +
          "Or run in Supabase → SQL Editor:\n" +
          '  ALTER TYPE "Role" ADD VALUE IF NOT EXISTS \'SUPER_ADMIN\';\n',
      );
      process.exit(1);
    }
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
