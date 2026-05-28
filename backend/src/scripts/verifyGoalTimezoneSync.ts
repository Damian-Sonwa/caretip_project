/**
 * Proves goal period boundaries match dashboard analytics (same businessTime helpers).
 * Run: npm run verify:goal-timezone (from backend/)
 */
import { DateTime } from "luxon";
import {
  businessUtcRangeForGoalPeriod,
  businessUtcRangeForTimeframe,
  effectiveGoalPeriodBounds,
  goalPeriodToBusinessTimeframe,
  type GoalCalendarPeriod,
} from "../utils/businessTime.js";

const TZ = "Europe/Berlin";
const PERIODS: GoalCalendarPeriod[] = ["daily", "weekly", "monthly"];

function assertEq(label: string, a: Date, b: Date): void {
  if (a.getTime() !== b.getTime()) {
    throw new Error(
      `${label}: expected ${a.toISOString()} === ${b.toISOString()}`,
    );
  }
}

function verifyAt(nowIso: string): void {
  const now = DateTime.fromISO(nowIso, { zone: "utc" });
  if (!now.isValid) throw new Error(`invalid instant: ${nowIso}`);
  for (const period of PERIODS) {
    const tf = goalPeriodToBusinessTimeframe(period);
    const dash = businessUtcRangeForTimeframe(tf, TZ, now);
    const goal = businessUtcRangeForGoalPeriod(period, TZ, now);
    if (!dash || !goal) throw new Error(`null range at ${nowIso} period=${period}`);
    assertEq(`${nowIso} ${period} start`, dash.startUtc, goal.startUtc);
    assertEq(`${nowIso} ${period} end`, dash.endUtc, goal.endUtc);
  }
}

function main(): void {
  // Standard midday
  verifyAt("2026-05-28T12:00:00.000Z");
  // Just before Berlin midnight (still prior local day)
  verifyAt("2026-05-28T21:59:59.000Z");
  // Just after Berlin midnight (new local day)
  verifyAt("2026-05-28T22:00:01.000Z");
  // Monday week boundary (Berlin): 2026-06-02 is Tuesday
  verifyAt("2026-06-02T01:00:00.000Z");

  const now = DateTime.fromISO("2026-05-28T15:00:00.000Z", { zone: "utc" });
  if (!now.isValid) throw new Error("invalid test instant");
  const startDate = new Date("2026-05-01T12:00:00.000Z");
  const bounds = effectiveGoalPeriodBounds("monthly", startDate, TZ, now.toJSDate());
  const month = businessUtcRangeForTimeframe("month", TZ, now);
  if (!month) throw new Error("month range null");
  assertEq("effective monthly start", bounds.startUtc, month.startUtc);

  console.log("OK: goal periods match dashboard boundaries for Europe/Berlin");
  console.log("  cases:", PERIODS.length * 4 + 1, "assertions at boundary instants");
}

main();
