import { EmployeeGoalStatus, GoalPeriod } from "@prisma/client";
import { prisma } from "../prisma.js";

export type GoalProgressStatus = "achieved" | "on_track" | "below_target";

export interface GoalWithProgress {
  id: string;
  employeeId: string;
  name: string;
  goalAmount: number;
  goalPeriod: GoalPeriod;
  lifecycleStatus: "active" | "archived";
  startDate: string;
  currentAmount: number;
  percent: number;
  status: GoalProgressStatus;
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

function startOfUtcWeekMonday(d: Date): Date {
  const day = d.getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + mondayOffset, 0, 0, 0, 0)
  );
}

function startOfUtcMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
}

/** End of current period (exclusive upper bound for queries). */
function endOfUtcDay(d: Date): Date {
  const x = startOfUtcDay(d);
  x.setUTCDate(x.getUTCDate() + 1);
  return new Date(x.getTime() - 1);
}

function endOfUtcWeek(d: Date): Date {
  const m = startOfUtcWeekMonday(d);
  const e = new Date(m);
  e.setUTCDate(e.getUTCDate() + 7);
  return new Date(e.getTime() - 1);
}

function endOfUtcMonth(d: Date): Date {
  const y = d.getUTCFullYear();
  const mo = d.getUTCMonth();
  return new Date(Date.UTC(y, mo + 1, 0, 23, 59, 59, 999));
}

/**
 * Effective window for progress: current calendar period intersected with [startDate, now].
 */
export function effectivePeriodBounds(
  period: GoalPeriod,
  startDate: Date,
  now = new Date()
): { start: Date; end: Date } {
  const sd = startOfUtcDay(startDate);
  if (period === GoalPeriod.daily) {
    const dayStart = startOfUtcDay(now);
    const start = dayStart.getTime() < sd.getTime() ? sd : dayStart;
    return { start, end: now };
  }
  if (period === GoalPeriod.weekly) {
    const weekStart = startOfUtcWeekMonday(now);
    const start = weekStart.getTime() < sd.getTime() ? sd : weekStart;
    return { start, end: now };
  }
  const monthStart = startOfUtcMonth(now);
  const start = monthStart.getTime() < sd.getTime() ? sd : monthStart;
  return { start, end: now };
}

/** Expected progress ratio through the period (0–1) for pacing "on track". */
function elapsedRatioInPeriod(period: GoalPeriod, now: Date): number {
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const h = now.getUTCHours();
  const min = now.getUTCMinutes();
  const sec = now.getUTCSeconds();
  const msIntoDay = ((h * 60 + min) * 60 + sec) * 1000 + now.getMilliseconds();

  if (period === GoalPeriod.daily) {
    return Math.min(1, Math.max(0, msIntoDay / 86400000));
  }
  if (period === GoalPeriod.weekly) {
    const mon = startOfUtcWeekMonday(now);
    const msSinceMon = now.getTime() - mon.getTime();
    return Math.min(1, Math.max(0, msSinceMon / (7 * 86400000)));
  }
  const dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const startM = startOfUtcMonth(now);
  const msSinceMonth = now.getTime() - startM.getTime();
  const monthMs = dim * 86400000;
  return Math.min(1, Math.max(0, msSinceMonth / monthMs));
}

function computeStatus(
  current: number,
  goal: number,
  period: GoalPeriod,
  now: Date
): GoalProgressStatus {
  if (goal <= 0) return "below_target";
  if (current >= goal) return "achieved";
  const ratio = current / goal;
  const expected = elapsedRatioInPeriod(period, now);
  const threshold = Math.max(0.05, expected * 0.85);
  if (ratio >= threshold) return "on_track";
  return "below_target";
}

async function sumTips(employeeId: string, start: Date, end: Date): Promise<number> {
  const agg = await prisma.transaction.aggregate({
    where: {
      employeeId,
      status: "success",
      createdAt: { gte: start, lte: end },
    },
    _sum: { amount: true },
  });
  return agg._sum.amount != null ? Number(agg._sum.amount) : 0;
}

export async function getGoalProgressForEmployee(
  employeeId: string,
  row: { id: string; goalAmount: unknown; goalPeriod: GoalPeriod; startDate: Date },
  now = new Date()
): Promise<Omit<GoalWithProgress, "status"> & { status: GoalProgressStatus }> {
  const goalAmount = Number(row.goalAmount);
  const { start, end } = effectivePeriodBounds(row.goalPeriod, row.startDate, now);
  const currentAmount = await sumTips(employeeId, start, end);
  const percent = goalAmount > 0 ? Math.min(100, Math.round((currentAmount / goalAmount) * 100)) : 0;
  const status = computeStatus(currentAmount, goalAmount, row.goalPeriod, now);
  return {
    id: row.id,
    employeeId,
    name: "Tip goal",
    lifecycleStatus: "active",
    goalAmount,
    goalPeriod: row.goalPeriod,
    startDate: row.startDate.toISOString().slice(0, 10),
    currentAmount,
    percent,
    status,
  };
}

export async function getMyGoalWithProgress(userId: string): Promise<GoalWithProgress | null> {
  const emp = await prisma.employee.findUnique({
    where: { userId },
    select: {
      id: true,
      employeeGoals: {
        where: { status: EmployeeGoalStatus.active },
        orderBy: [{ updatedAt: "desc" }],
        take: 1,
      },
    },
  });
  const g = emp?.employeeGoals?.[0];
  if (!emp?.id || !g) return null;
  return getGoalProgressForEmployee(emp.id, {
    id: g.id,
    goalAmount: g.goalAmount,
    goalPeriod: g.goalPeriod,
    startDate: g.startDate,
  }).then((p) => ({ ...p, name: g.name, lifecycleStatus: g.status }));
}

export async function upsertMyGoal(
  userId: string,
  input: { goalAmount: number; goalPeriod: GoalPeriod; startDate: string }
): Promise<GoalWithProgress> {
  const emp = await prisma.employee.findUnique({ where: { userId }, select: { id: true } });
  if (!emp) throw new Error("Employee not found");

  if (input.goalAmount < 0 || !Number.isFinite(input.goalAmount)) {
    throw new Error("Goal amount must be a non-negative number");
  }

  const sd = new Date(input.startDate + "T12:00:00.000Z");
  if (Number.isNaN(sd.getTime())) throw new Error("Invalid start date");

  // Back-compat for old `/api/employees/me/goal` endpoint: update the most recent active goal,
  // otherwise create a new active goal.
  const existing = await prisma.employeeGoal.findFirst({
    where: { employeeId: emp.id, status: EmployeeGoalStatus.active },
    orderBy: [{ updatedAt: "desc" }],
    select: { id: true },
  });

  const row = existing
    ? await prisma.employeeGoal.update({
        where: { id: existing.id },
        data: {
          goalAmount: input.goalAmount,
          goalPeriod: input.goalPeriod,
          startDate: sd,
          status: EmployeeGoalStatus.active,
        },
      })
    : await prisma.employeeGoal.create({
        data: {
          employeeId: emp.id,
          name: "Tip goal",
          goalAmount: input.goalAmount,
          goalPeriod: input.goalPeriod,
          status: EmployeeGoalStatus.active,
          startDate: sd,
        },
      });

  const p = await getGoalProgressForEmployee(emp.id, {
    id: row.id,
    goalAmount: row.goalAmount,
    goalPeriod: row.goalPeriod,
    startDate: row.startDate,
  });
  return { ...(p as GoalWithProgress), name: row.name, lifecycleStatus: row.status };
}

export async function deleteMyGoal(userId: string): Promise<void> {
  const emp = await prisma.employee.findUnique({ where: { userId }, select: { id: true } });
  if (!emp) throw new Error("Employee not found");
  // Back-compat: delete active goal only.
  await prisma.employeeGoal.deleteMany({ where: { employeeId: emp.id, status: EmployeeGoalStatus.active } });
}

export async function listEmployeeGoalsForBusiness(businessId: string): Promise<
  Array<{
    employeeId: string;
    name: string;
    goalAmount: number;
    goalPeriod: GoalPeriod;
    startDate: string;
    currentAmount: number;
    percent: number;
    status: GoalProgressStatus;
  }>
> {
  const rows = await prisma.employeeGoal.findMany({
    where: { employee: { businessId } },
    include: { employee: { select: { id: true, name: true } } },
  });

  const out: Array<{
    employeeId: string;
    name: string;
    goalAmount: number;
    goalPeriod: GoalPeriod;
    startDate: string;
    currentAmount: number;
    percent: number;
    status: GoalProgressStatus;
  }> = [];

  for (const r of rows) {
    const p = await getGoalProgressForEmployee(r.employeeId, {
      id: r.id,
      goalAmount: r.goalAmount,
      goalPeriod: r.goalPeriod,
      startDate: r.startDate,
    });
    out.push({
      employeeId: r.employeeId,
      name: r.employee.name,
      goalAmount: p.goalAmount,
      goalPeriod: p.goalPeriod,
      startDate: p.startDate,
      currentAmount: p.currentAmount,
      percent: p.percent,
      status: p.status,
    });
  }

  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export type EmployeeGoalRow = {
  id: string;
  name: string;
  goalAmount: number;
  goalPeriod: GoalPeriod;
  status: EmployeeGoalStatus;
  startDate: string;
  createdAt: string;
  updatedAt: string;
};

export async function listMyGoals(userId: string): Promise<EmployeeGoalRow[]> {
  const emp = await prisma.employee.findUnique({ where: { userId }, select: { id: true } });
  if (!emp) throw new Error("Employee not found");
  const rows = await prisma.employeeGoal.findMany({
    where: { employeeId: emp.id },
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
  });
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    goalAmount: Number(r.goalAmount),
    goalPeriod: r.goalPeriod,
    status: r.status,
    startDate: r.startDate.toISOString().slice(0, 10),
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
}

export async function createMyGoal(
  userId: string,
  input: { name: string; goalAmount: number; goalPeriod: GoalPeriod; startDate: string }
): Promise<EmployeeGoalRow> {
  const emp = await prisma.employee.findUnique({ where: { userId }, select: { id: true } });
  if (!emp) throw new Error("Employee not found");
  const sd = new Date(input.startDate + "T12:00:00.000Z");
  if (Number.isNaN(sd.getTime())) throw new Error("Invalid start date");
  const row = await prisma.employeeGoal.create({
    data: {
      employeeId: emp.id,
      name: input.name.trim() || "Tip goal",
      goalAmount: input.goalAmount,
      goalPeriod: input.goalPeriod,
      status: EmployeeGoalStatus.active,
      startDate: sd,
    },
  });
  return {
    id: row.id,
    name: row.name,
    goalAmount: Number(row.goalAmount),
    goalPeriod: row.goalPeriod,
    status: row.status,
    startDate: row.startDate.toISOString().slice(0, 10),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function updateMyGoal(
  userId: string,
  goalId: string,
  input: Partial<{ name: string; goalAmount: number; goalPeriod: GoalPeriod; startDate: string }>
): Promise<EmployeeGoalRow> {
  const emp = await prisma.employee.findUnique({ where: { userId }, select: { id: true } });
  if (!emp) throw new Error("Employee not found");
  const row = await prisma.employeeGoal.findFirst({ where: { id: goalId, employeeId: emp.id } });
  if (!row) throw new Error("Goal not found");
  const sd =
    input.startDate !== undefined ? new Date(input.startDate + "T12:00:00.000Z") : undefined;
  if (sd && Number.isNaN(sd.getTime())) throw new Error("Invalid start date");
  const next = await prisma.employeeGoal.update({
    where: { id: row.id },
    data: {
      ...(input.name !== undefined ? { name: input.name.trim() || "Tip goal" } : {}),
      ...(input.goalAmount !== undefined ? { goalAmount: input.goalAmount } : {}),
      ...(input.goalPeriod !== undefined ? { goalPeriod: input.goalPeriod } : {}),
      ...(sd !== undefined ? { startDate: sd } : {}),
    },
  });
  return {
    id: next.id,
    name: next.name,
    goalAmount: Number(next.goalAmount),
    goalPeriod: next.goalPeriod,
    status: next.status,
    startDate: next.startDate.toISOString().slice(0, 10),
    createdAt: next.createdAt.toISOString(),
    updatedAt: next.updatedAt.toISOString(),
  };
}

export async function archiveMyGoal(userId: string, goalId: string): Promise<EmployeeGoalRow> {
  const emp = await prisma.employee.findUnique({ where: { userId }, select: { id: true } });
  if (!emp) throw new Error("Employee not found");
  const row = await prisma.employeeGoal.findFirst({ where: { id: goalId, employeeId: emp.id } });
  if (!row) throw new Error("Goal not found");
  const next = await prisma.employeeGoal.update({
    where: { id: row.id },
    data: { status: EmployeeGoalStatus.archived },
  });
  return {
    id: next.id,
    name: next.name,
    goalAmount: Number(next.goalAmount),
    goalPeriod: next.goalPeriod,
    status: next.status,
    startDate: next.startDate.toISOString().slice(0, 10),
    createdAt: next.createdAt.toISOString(),
    updatedAt: next.updatedAt.toISOString(),
  };
}

export async function deleteMyGoalById(userId: string, goalId: string): Promise<void> {
  const emp = await prisma.employee.findUnique({ where: { userId }, select: { id: true } });
  if (!emp) throw new Error("Employee not found");
  const row = await prisma.employeeGoal.findFirst({ where: { id: goalId, employeeId: emp.id } });
  if (!row) throw new Error("Goal not found");
  await prisma.employeeGoal.delete({ where: { id: row.id } });
}
