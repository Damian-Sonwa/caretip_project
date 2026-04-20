/**
 * Prisma CLI config (replaces package.json#prisma for Prisma 7 readiness).
 * Load env here so `npx prisma` works without dotenv-cli (same order as API: repo root .env, then backend/.env).
 * @see https://www.prisma.io/docs/orm/reference/prisma-config-reference
 */
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "prisma/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });
dotenv.config({ path: path.join(__dirname, ".env") });

export default defineConfig({
  schema: path.join(__dirname, "prisma", "schema.prisma"),
  migrations: {
    path: path.join(__dirname, "prisma", "migrations"),
    seed: "tsx prisma/seed.ts",
  },
});
