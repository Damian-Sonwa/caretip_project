import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../prisma.js";
import { createPaymentIntent, isStripeConfigured } from "../services/stripe.service.js";
import * as goalService from "../services/goal.service.js";
import * as businessService from "../services/business.service.js";
import {
  getEmployeeTipsContext,
  loadEmployeeAccountSummary,
  loadEmployeeCurrentMonthTotal,
  loadEmployeeDashboardSummaryBundle,
  loadEmployeePeriodAnalytics,
  loadEmployeeTipsDashboardForTimeframe,
} from "../services/employeeTipsDashboard.service.js";
import { MIN_TIP_AMOUNT_EUR, MAX_TIP_AMOUNT_EUR } from "../constants/tipAmountLimits.js";
import { logServerError, clientSafeMessage, CLIENT_FALLBACK } from "../utils/httpErrors.js";
import { TipPaymentEligibilityError } from "../services/tipPaymentEligibility.service.js";
import { logDashboardTiming } from "../utils/dashboardTiming.js";
import { logDashboardTenant } from "../utils/dashboardTenantLog.js";
import { runSerializedByKey } from "../utils/serializedByKey.js";
import { businessUtcRangeForLocalDates, businessUtcRangeForTimeframe, sanitizeIanaTimezone } from "../utils/businessTime.js";
import { isEmployeeTipsScopeAllowedForTier } from "../config/subscriptionCapabilities.js";
import {
  getSubscriptionTierForBusinessId,
  subscriptionBypass,
  subscriptionRequiredPayload,
} from "../services/subscriptionEntitlement.service.js";

function tipsErrorHttpStatus(err: unknown): number {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2024" || err.code === "P2021" || err.code === "P2022") return 503;
    if (["P1001", "P1002", "P1008", "P1017"].includes(err.code)) return 503;
  }
  return 400;
}

export async function getByEmployee(req: Request, res: Response) {
  try {
    const userId = req.user?.userId ?? req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }
    const employee = await getEmployeeTipsContext(userId);
    if (!employee) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    logDashboardTenant("tips.getByEmployee", {
      userId,
      employeeId: employee.id,
      businessId: employee.businessId,
      role: req.user?.role ?? null,
      scope: typeof req.query.scope === "string" ? req.query.scope : "full",
      timeframe: typeof req.query.timeframe === "string" ? req.query.timeframe : null,
    });
    const timeframeRaw = typeof req.query.timeframe === "string" ? req.query.timeframe.trim() : "";
    const timeframe =
      timeframeRaw === "today" || timeframeRaw === "week" || timeframeRaw === "month"
        ? (timeframeRaw as "today" | "week" | "month")
        : null;
    const scopeRaw = typeof req.query.scope === "string" ? req.query.scope.trim() : "";
    const scope =
      scopeRaw === "account" || scopeRaw === "summary" || scopeRaw === "analytics"
        ? scopeRaw
        : "full";

    if (scope === "account") {
      const accountSummary = await logDashboardTiming(
        "employee.tips.account",
        { employeeId: employee.id, scope },
        () => loadEmployeeAccountSummary(employee.id),
      );
      return res.json({
        tips: [],
        monthlyGoal: employee.monthlyGoal,
        currentMonthTotal: 0,
        businessTimezone: employee.businessTimezone,
        periodAmountEur: 0,
        periodTipCount: 0,
        chartSeries: [],
        goal: null,
        totalEarningsEur: accountSummary.totalEarningsEur,
        availableBalanceEur: accountSummary.availableBalanceEur,
        totalSupporters: accountSummary.totalSupporters,
      });
    }

    if (!subscriptionBypass(req)) {
      const tier = await getSubscriptionTierForBusinessId(employee.businessId);
      if (!isEmployeeTipsScopeAllowedForTier(tier, scope)) {
        return res.status(403).json(subscriptionRequiredPayload("advancedAnalytics"));
      }
    }

    if (timeframe == null) {
      const [accountSummary, currentMonthTotal, goal] = await Promise.all([
        loadEmployeeAccountSummary(employee.id),
        loadEmployeeCurrentMonthTotal(employee.id, employee.businessTimezone),
        goalService.getMyGoalWithProgress(userId).catch(() => null),
      ]);
      return res.json({
        tips: [],
        monthlyGoal: employee.monthlyGoal,
        currentMonthTotal,
        businessTimezone: employee.businessTimezone,
        periodAmountEur: 0,
        periodTipCount: 0,
        chartSeries: [],
        goal,
        totalEarningsEur: accountSummary.totalEarningsEur,
        availableBalanceEur: accountSummary.availableBalanceEur,
        totalSupporters: accountSummary.totalSupporters,
      });
    }

    if (scope === "summary") {
      const { summary, accountSummary } = await logDashboardTiming(
        "employee.tips.summary",
        { employeeId: employee.id, timeframe, scope },
        () =>
          runSerializedByKey(`emp-stats-summary:${employee.id}:${timeframe}`, async () => {
            const summaryResult = await loadEmployeeDashboardSummaryBundle({
              employeeId: employee.id,
              userId,
              businessTimezone: employee.businessTimezone,
              timeframe,
              activeGoal: employee.activeGoal,
            });
            const accountResult = await loadEmployeeAccountSummary(employee.id);
            return { summary: summaryResult, accountSummary: accountResult };
          }),
      );
      return res.json({
        tips: summary.tips,
        monthlyGoal: employee.monthlyGoal,
        currentMonthTotal: summary.currentMonthTotal,
        businessTimezone: employee.businessTimezone,
        periodAmountEur: summary.periodAmountEur,
        periodTipCount: summary.periodTipCount,
        averageRating: summary.averageRating,
        ratingCount: summary.ratingCount,
        chartSeries: summary.chartSeries,
        goal: summary.goal,
        analyticsBundled: true,
        totalEarningsEur: accountSummary.totalEarningsEur,
        availableBalanceEur: accountSummary.availableBalanceEur,
        totalSupporters: accountSummary.totalSupporters,
      });
    }

    if (scope === "analytics") {
      const analytics = await logDashboardTiming(
        "employee.tips.analytics",
        { employeeId: employee.id, timeframe, scope },
        () =>
          runSerializedByKey(`emp-stats-summary:${employee.id}:${timeframe}`, () =>
            loadEmployeePeriodAnalytics({
              employeeId: employee.id,
              businessTimezone: employee.businessTimezone,
              timeframe,
            }),
          ),
      );
      return res.json({
        tips: analytics.tips,
        businessTimezone: employee.businessTimezone,
        periodAmountEur: 0,
        periodTipCount: 0,
        chartSeries: analytics.chartSeries,
      });
    }

    const dash = await runSerializedByKey(`emp-stats-full:${employee.id}:${timeframe}`, () =>
      loadEmployeeTipsDashboardForTimeframe({
        employeeId: employee.id,
        businessTimezone: employee.businessTimezone,
        timeframe,
      }),
    );
    const [accountSummary, currentMonthTotal, goal] = await Promise.all([
      loadEmployeeAccountSummary(employee.id),
      loadEmployeeCurrentMonthTotal(employee.id, employee.businessTimezone),
      goalService.getMyGoalWithProgress(userId).catch(() => null),
    ]);

    return res.json({
      monthlyGoal: employee.monthlyGoal,
      currentMonthTotal,
      businessTimezone: employee.businessTimezone,
      goal,
      totalEarningsEur: accountSummary.totalEarningsEur,
      availableBalanceEur: accountSummary.availableBalanceEur,
      totalSupporters: accountSummary.totalSupporters,
      tips: dash.tips,
      periodAmountEur: dash.periodAmountEur,
      periodTipCount: dash.periodTipCount,
      chartSeries: dash.chartSeries,
    });
  } catch (err) {
    logServerError("tips.getByEmployee", err);
    return res.status(tipsErrorHttpStatus(err)).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.tips),
    });
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
    logDashboardTenant("tips.getByBusiness", {
      userId,
      businessId: b.id,
      role: req.user?.role ?? null,
    });

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
    const employee = await getEmployeeTipsContext(userId);
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

/** Legacy Payment Intent endpoint — QR flow uses POST /api/payments/create-tip-session instead. */
export async function createIntent(req: Request, res: Response) {
  try {
    const { amount, employeeId, businessId, locationId, tableId } = req.body;
    if (!amount || !employeeId || !businessId) {
      return res.status(400).json({
        message: "amount, employeeId, and businessId are required",
      });
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < MIN_TIP_AMOUNT_EUR || numAmount > MAX_TIP_AMOUNT_EUR) {
      return res.status(400).json({ message: "Invalid amount" });
    }
    if (typeof employeeId !== "string" || typeof businessId !== "string") {
      return res.status(400).json({ message: "Invalid employee or business id" });
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
    if (err instanceof TipPaymentEligibilityError) {
      return res.status(400).json({
        message: err.message,
        code: err.code,
      });
    }
    return res.status(400).json({
      message: clientSafeMessage(err, CLIENT_FALLBACK.payment),
    });
  }
}
