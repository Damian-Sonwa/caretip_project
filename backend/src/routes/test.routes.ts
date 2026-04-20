import { Router } from "express";
import { prisma } from "../prisma.js";

const router = Router();

/** GET /api/test — smoke test (no auth). */
router.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "caretip-api",
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  });
});

/** GET /api/test/db — verify Prisma can query Postgres (same URL as login). */
router.get("/db", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.json({ ok: true, database: "reachable" });
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err ? String((err as { code?: string }).code) : undefined;
    return res.status(503).json({
      ok: false,
      database: "unreachable",
      prismaCode: code,
      message: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
