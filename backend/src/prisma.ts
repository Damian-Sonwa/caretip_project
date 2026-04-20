import dns from "node:dns";
import { PrismaClient } from "@prisma/client";

// Prefer IPv4 when resolving hostnames (helps avoid Prisma P1001 to Supabase pooler on Windows).
dns.setDefaultResultOrder("ipv4first");

/**
 * One Prisma client; datasource URL comes only from env via DATABASE_URL.
 */
export const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});
