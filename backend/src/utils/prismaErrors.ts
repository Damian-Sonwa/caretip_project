import { Prisma } from "@prisma/client";

/** Prisma P2024 — connection pool saturated (common with Supabase transaction pooler + connection_limit=1). */
export function isPrismaPoolTimeout(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2024";
}
