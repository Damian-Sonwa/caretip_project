import { Router } from "express";
import { runTrialReminderEmails } from "../services/trialReminderEmail.service.js";

const router = Router();

function authorizeCronRequest(req: import("express").Request): boolean {
  const secret =
    process.env.CRON_SECRET?.trim() ||
    process.env.HEALTH_CHECK_SECRET?.trim();
  if (!secret) return false;
  return req.get("x-cron-secret") === secret;
}

/** POST /api/internal/jobs/trial-reminders — idempotent trial ending reminders (7 / 3 / 1 days). */
router.post("/trial-reminders", async (req, res) => {
  if (!authorizeCronRequest(req)) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const result = await runTrialReminderEmails();
  return res.json({ ok: true, ...result });
});

export default router;
