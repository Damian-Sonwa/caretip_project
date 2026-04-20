import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { createPaymentIntent, isStripeConfigured } from "../services/stripe.service.js";
import * as tipsService from "../services/tips.service.js";
import * as goalService from "../services/goal.service.js";
import { logServerError, clientSafeMessage, CLIENT_FALLBACK } from "../utils/httpErrors.js";

async function findEmployeeForTipsByUserId(
  userId: string,
): Promise<{ id: string; monthlyGoal: number | null } | null> {
  try {
    const row = await prisma.employee.findUnique({
      where: { userId },
      select: { id: true, monthlyGoal: true },
    });
    if (!row) return null;
    return {
      id: row.id,
      monthlyGoal: row.monthlyGoal != null ? Number(row.monthlyGoal) : null,
    };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2022") {
      const row = await prisma.employee.findUnique({
        where: { userId },
        select: { id: true },
      });
      if (!row) return null;
      return { id: row.id, monthlyGoal: null };
    }
    throw e;
  }
}

export async function getByEmployee(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const employee = await findEmployeeForTipsByUserId(userId);
    if (!employee) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    const tips = await tipsService.getTipsByEmployeeId(employee.id);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthTotal = tips
      .filter((t) => new Date(t.createdAt) >= startOfMonth)
      .reduce((s, t) => s + t.amount, 0);
    const monthlyGoal = employee.monthlyGoal;
    let goal = null as Awaited<ReturnType<typeof goalService.getMyGoalWithProgress>>;
    try {
      goal = await goalService.getMyGoalWithProgress(userId);
    } catch {
      /* optional before migration */
    }
    return res.json({
      tips,
      monthlyGoal,
      currentMonthTotal,
      goal,
    });
  } catch (err) {
    logServerError("tips.getByEmployee", err);
    const message = err instanceof Error ? err.message : "Failed to fetch tips";
    return res.status(400).json({ message });
  }
}

export async function createIntent(req: Request, res: Response) {
  try {
    const { amount, employeeId, businessId, locationId, tableId } = req.body;
    if (!amount || !employeeId || !businessId) {
      return res.status(400).json({
        message: "amount, employeeId, and businessId are required",
      });
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    if (!isStripeConfigured()) {
      return res.status(503).json({
        message: "Payment processing is not configured yet.",
        code: "STRIPE_NOT_CONFIGURED",
      });
    }
    const result = await createPaymentIntent({
      amount: numAmount,
      employeeId,
      businessId,
      locationId: typeof locationId === "string" ? locationId : undefined,
      tableId: typeof tableId === "string" ? tableId : undefined,
    });
    return res.json(result);
  } catch (err) {
    logServerError("tips.createIntent", err);
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.payment),
    });
  }
}
