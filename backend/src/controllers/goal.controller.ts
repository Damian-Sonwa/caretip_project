import type { Request, Response } from "express";
import { EmployeeGoalStatus, GoalPeriod } from "@prisma/client";
import * as goalService from "../services/goal.service.js";
import { logServerError, clientSafeMessage, CLIENT_FALLBACK } from "../utils/httpErrors.js";

const PERIODS = new Set<string>(["daily", "weekly", "monthly"]);

function parseGoalId(req: Request): string | null {
  const raw = req.params?.goalId;
  const id = typeof raw === "string" ? raw.trim() : "";
  return id ? id : null;
}

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

// New CRUD for multi-goal management (/api/goals)

export async function listMyGoals(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const goals = await goalService.listMyGoals(userId);
    return res.json({ goals });
  } catch (err) {
    logServerError("goal.listMyGoals", err);
    return res.status(500).json({ message: clientSafeMessage(err, CLIENT_FALLBACK.employee) });
  }
}

export async function createMyGoal(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const { name, goalAmount, goalPeriod, startDate } = req.body ?? {};
    if (goalAmount === undefined || goalPeriod === undefined || startDate === undefined) {
      return res.status(400).json({ message: "name, goalAmount, goalPeriod, and startDate are required" });
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
    const row = await goalService.createMyGoal(userId, {
      name: typeof name === "string" ? name : "Tip goal",
      goalAmount: n,
      goalPeriod: goalPeriod as GoalPeriod,
      startDate: startDate.trim(),
    });
    return res.status(201).json({ goal: row });
  } catch (err) {
    logServerError("goal.createMyGoal", err);
    const msg = err instanceof Error ? err.message : "Failed to create goal";
    return res.status(400).json({ message: msg });
  }
}

export async function updateMyGoal(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const goalId = parseGoalId(req);
    if (!goalId) return res.status(400).json({ message: "Goal id is required" });
    const { name, goalAmount, goalPeriod, startDate } = req.body ?? {};
    if (goalAmount !== undefined) {
      const n = Number(goalAmount);
      if (Number.isNaN(n) || n < 0) return res.status(400).json({ message: "goalAmount must be a non-negative number" });
    }
    if (goalPeriod !== undefined) {
      if (typeof goalPeriod !== "string" || !PERIODS.has(goalPeriod)) {
        return res.status(400).json({ message: "goalPeriod must be daily, weekly, or monthly" });
      }
    }
    if (startDate !== undefined) {
      if (typeof startDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(startDate.trim())) {
        return res.status(400).json({ message: "startDate must be YYYY-MM-DD" });
      }
    }
    const row = await goalService.updateMyGoal(userId, goalId, {
      ...(name !== undefined ? { name: String(name) } : {}),
      ...(goalAmount !== undefined ? { goalAmount: Number(goalAmount) } : {}),
      ...(goalPeriod !== undefined ? { goalPeriod: goalPeriod as GoalPeriod } : {}),
      ...(startDate !== undefined ? { startDate: String(startDate).trim() } : {}),
    });
    return res.json({ goal: row });
  } catch (err) {
    logServerError("goal.updateMyGoal", err);
    const msg = err instanceof Error ? err.message : "Failed to update goal";
    const status = msg.includes("not found") ? 404 : 400;
    return res.status(status).json({ message: msg });
  }
}

export async function archiveMyGoal(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const goalId = parseGoalId(req);
    if (!goalId) return res.status(400).json({ message: "Goal id is required" });
    const row = await goalService.archiveMyGoal(userId, goalId);
    return res.json({ goal: row });
  } catch (err) {
    logServerError("goal.archiveMyGoal", err);
    const msg = err instanceof Error ? err.message : "Failed to archive goal";
    const status = msg.includes("not found") ? 404 : 400;
    return res.status(status).json({ message: msg });
  }
}

export async function deleteMyGoalById(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const goalId = parseGoalId(req);
    if (!goalId) return res.status(400).json({ message: "Goal id is required" });
    await goalService.deleteMyGoalById(userId, goalId);
    return res.status(204).send();
  } catch (err) {
    logServerError("goal.deleteMyGoalById", err);
    const msg = err instanceof Error ? err.message : "Failed to delete goal";
    const status = msg.includes("not found") ? 404 : 400;
    return res.status(status).json({ message: msg });
  }
}
