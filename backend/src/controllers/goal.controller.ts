import type { Request, Response } from "express";
import { GoalPeriod } from "@prisma/client";
import * as goalService from "../services/goal.service.js";
import { logServerError, clientSafeMessage, CLIENT_FALLBACK } from "../utils/httpErrors.js";

const PERIODS = new Set<string>(["daily", "weekly", "monthly"]);

export async function getMyGoal(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const goal = await goalService.getMyGoalWithProgress(userId);
    return res.json({ goal });
  } catch (err) {
    logServerError("goal.getMyGoal", err);
    return res.status(500).json({ message: clientSafeMessage(err, CLIENT_FALLBACK.employee) });
  }
}

export async function putMyGoal(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const { goalAmount, goalPeriod, startDate } = req.body ?? {};
    if (goalAmount === undefined || goalPeriod === undefined || startDate === undefined) {
      return res.status(400).json({ message: "goalAmount, goalPeriod, and startDate are required" });
    }
    const n = Number(goalAmount);
    if (Number.isNaN(n) || n < 0) {
      return res.status(400).json({ message: "goalAmount must be a non-negative number" });
    }
    if (typeof goalPeriod !== "string" || !PERIODS.has(goalPeriod)) {
      return res.status(400).json({ message: "goalPeriod must be daily, weekly, or monthly" });
    }
    if (typeof startDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
      return res.status(400).json({ message: "startDate must be YYYY-MM-DD" });
    }
    const goal = await goalService.upsertMyGoal(userId, {
      goalAmount: n,
      goalPeriod: goalPeriod as GoalPeriod,
      startDate: startDate.trim(),
    });
    return res.json({ goal });
  } catch (err) {
    logServerError("goal.putMyGoal", err);
    const msg = err instanceof Error ? err.message : "Failed to save goal";
    if (msg.includes("Invalid") || msg.includes("not found")) {
      return res.status(400).json({ message: msg });
    }
    return res.status(500).json({ message: clientSafeMessage(err, CLIENT_FALLBACK.employee) });
  }
}

export async function deleteMyGoal(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    await goalService.deleteMyGoal(userId);
    return res.status(204).send();
  } catch (err) {
    logServerError("goal.deleteMyGoal", err);
    return res.status(500).json({ message: clientSafeMessage(err, CLIENT_FALLBACK.employee) });
  }
}
