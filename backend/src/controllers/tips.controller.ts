import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { createPaymentIntent, isStripeConfigured } from "../services/stripe.service.js";
import * as tipsService from "../services/tips.service.js";
import * as goalService from "../services/goal.service.js";
import * as businessService from "../services/business.service.js";
import { logServerError, clientSafeMessage, CLIENT_FALLBACK } from "../utils/httpErrors.js";
import {
  businessUtcRangeForTimeframe,
  businessUtcRangeForLocalDates,
  sanitizeIanaTimezone,
} from "../utils/businessTime.js";

async function findEmployeeForTipsByUserId(
  userId: string,
): Promise<{ id: string; monthlyGoal: number | null; businessTimezone: string } | null> {
  try {
    const row = await prisma.employee.findUnique({
      where: { userId },
      select: { id: true, monthlyGoal: true, business: { select: { timezone: true } } },
    });
    if (!row) return null;
    return {
      id: row.id,
      monthlyGoal: row.monthlyGoal != null ? Number(row.monthlyGoal) : null,
      businessTimezone: sanitizeIanaTimezone((row as any).business?.timezone),
    };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2022") {
      const row = await prisma.employee.findUnique({
        where: { userId },
        select: { id: true, business: { select: { timezone: true } } },
      });
      if (!row) return null;
      return {
        id: row.id,
        monthlyGoal: null,
        businessTimezone: sanitizeIanaTimezone((row as any).business?.timezone),
      };
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
    const tipsAll = await tipsService.getTipsByEmployeeId(employee.id);
    const timeframeRaw = typeof req.query.timeframe === "string" ? req.query.timeframe.trim() : "";
    const timeframe =
      timeframeRaw === "today" || timeframeRaw === "week" || timeframeRaw === "month"
        ? (timeframeRaw as "today" | "week" | "month")
        : null;
    const tips =
      timeframe === null
        ? tipsAll
        : (() => {
            const r = businessUtcRangeForTimeframe(timeframe, employee.businessTimezone);
            if (!r) return tipsAll;
            const start = r.startUtc.getTime();
            const end = r.endUtc.getTime();
            return tipsAll.filter((t) => {
              const ms = new Date(t.createdAt).getTime();
              return ms >= start && ms < end;
            });
          })();
    const monthRange = businessUtcRangeForTimeframe("month", employee.businessTimezone);
    const startUtc = monthRange?.startUtc ?? new Date(0);
    const currentMonthTotalAgg = await prisma.transaction.aggregate({
      where: { employeeId: employee.id, status: "success", createdAt: { gte: startUtc } },
      _sum: { amount: true },
    });
    const currentMonthTotal = Number(currentMonthTotalAgg._sum.amount ?? 0);
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
      businessTimezone: employee.businessTimezone,
      goal,
    });
  } catch (err) {
    logServerError("tips.getByEmployee", err);
    const message = err instanceof Error ? err.message : "Failed to fetch tips";
    return res.status(400).json({ message });
  }
}

type TipStatus = "success" | "pending" | "failed";

function parseTakeSkip(req: Request): { take: number; skip: number } {
  const takeRaw = req.query.take;
  const skipRaw = req.query.skip;
  const take = Math.max(1, Math.min(200, Number(takeRaw ?? 50) || 50));
  const skip = Math.max(0, Number(skipRaw ?? 0) || 0);
  return { take, skip };
}

function parseDate(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseStatus(value: unknown): TipStatus | null {
  if (typeof value !== "string") return null;
  const s = value.trim();
  if (s === "success" || s === "pending" || s === "failed") return s;
  return null;
}

function toTipRow(t: {
  id: string;
  amount: unknown;
  status: string;
  createdAt: Date;
  employeeId: string;
  locationId: string | null;
  tableId: string | null;
  employee?: { id: string; name: string } | null;
  location?: { id: string; name: string } | null;
  table?: { id: string; name: string } | null;
}) {
  return {
    id: t.id,
    amount: Number(t.amount),
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    employeeId: t.employeeId,
    locationId: t.locationId,
    tableId: t.tableId,
    staffName: t.employee?.name ?? null,
    locationName: t.location?.name ?? null,
    tableName: t.table?.name ?? null,
  };
}

export async function getByBusiness(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const b = await businessService.getBusinessByUserId(userId);
    if (!b) return res.status(404).json({ message: "Business not found" });

    const { take, skip } = parseTakeSkip(req);
    const status = parseStatus(req.query.status);
    const rangeRaw = typeof req.query.range === "string" ? req.query.range.trim() : "";
    const range =
      rangeRaw === "today" || rangeRaw === "week" || rangeRaw === "month"
        ? (rangeRaw as "today" | "week" | "month")
        : null;
    const customFrom = typeof req.query.fromDate === "string" ? req.query.fromDate.trim() : undefined;
    const customTo = typeof req.query.toDate === "string" ? req.query.toDate.trim() : undefined;
    const from = parseDate(req.query.from); // legacy
    const to = parseDate(req.query.to); // legacy
    const employeeId = typeof req.query.employeeId === "string" ? req.query.employeeId.trim() : "";
    const locationId = typeof req.query.locationId === "string" ? req.query.locationId.trim() : "";
    const tableId = typeof req.query.tableId === "string" ? req.query.tableId.trim() : "";

    const tz = sanitizeIanaTimezone((b as any).timezone);
    const presetRange = range ? businessUtcRangeForTimeframe(range, tz) : null;
    const customRange = rangeRaw === "custom" ? businessUtcRangeForLocalDates(customFrom, customTo, tz) : null;
    const chosenRange = presetRange ?? customRange;

    const where: Record<string, unknown> = {
      businessId: b.id,
      ...(status ? { status } : {}),
      ...(employeeId ? { employeeId } : {}),
      ...(locationId ? { locationId } : {}),
      ...(tableId ? { tableId } : {}),
      ...(chosenRange
        ? {
            createdAt: {
              gte: chosenRange.startUtc,
              lte: chosenRange.endUtc,
            },
          }
        : from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.transaction.count({ where: where as never }),
      prisma.transaction.findMany({
        where: where as never,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          employee: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
          table: { select: { id: true, name: true } },
        },
      }),
    ]);

    return res.json({ timezone: tz, total, items: rows.map(toTipRow) });
  } catch (err) {
    logServerError("tips.getByBusiness", err);
    return res.status(500).json({ message: clientSafeMessage(err, CLIENT_FALLBACK.employee) });
  }
}

export async function listByEmployee(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    const employee = await findEmployeeForTipsByUserId(userId);
    if (!employee) return res.status(403).json({ message: "Insufficient permissions" });

    const { take, skip } = parseTakeSkip(req);
    const status = parseStatus(req.query.status);
    const rangeRaw = typeof req.query.range === "string" ? req.query.range.trim() : "";
    const range =
      rangeRaw === "today" || rangeRaw === "week" || rangeRaw === "month"
        ? (rangeRaw as "today" | "week" | "month")
        : null;
    const customFrom = typeof req.query.fromDate === "string" ? req.query.fromDate.trim() : undefined;
    const customTo = typeof req.query.toDate === "string" ? req.query.toDate.trim() : undefined;
    const from = parseDate(req.query.from); // legacy
    const to = parseDate(req.query.to); // legacy

    const tz = employee.businessTimezone;
    const presetRange = range ? businessUtcRangeForTimeframe(range, tz) : null;
    const customRange = rangeRaw === "custom" ? businessUtcRangeForLocalDates(customFrom, customTo, tz) : null;
    const chosenRange = presetRange ?? customRange;

    const where: Record<string, unknown> = {
      employeeId: employee.id,
      ...(status ? { status } : {}),
      ...(chosenRange
        ? {
            createdAt: {
              gte: chosenRange.startUtc,
              lte: chosenRange.endUtc,
            },
          }
        : from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.transaction.count({ where: where as never }),
      prisma.transaction.findMany({
        where: where as never,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          employee: { select: { id: true, name: true } },
          location: { select: { id: true, name: true } },
          table: { select: { id: true, name: true } },
        },
      }),
    ]);

    return res.json({ timezone: tz, total, items: rows.map(toTipRow) });
  } catch (err) {
    logServerError("tips.listByEmployee", err);
    return res.status(500).json({ message: clientSafeMessage(err, CLIENT_FALLBACK.employee) });
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
