/**
 * Quick DB connectivity test. Run from backend: npm run db:test
 * Uses the same env + Prisma URL as the API (no localhost fallback).
 */
import "dotenv/config";
import "../src/loadEnv.js";
import { prisma } from "../src/prisma.js";

async function test() {
  try {
    const users = await prisma.user.findMany();
    console.log("Database connection successful. Users:", users);
  } catch (err) {
    console.error("Database connection failed:", err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

void test();
