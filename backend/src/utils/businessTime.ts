import { DateTime } from "luxon";

export const DEFAULT_BUSINESS_TIMEZONE = "Europe/Berlin";

export type BusinessTimeframe = "today" | "week" | "month" | "year" | "all";

export function sanitizeIanaTimezone(tz: unknown): string {
  const raw = typeof tz === "string" ? tz.trim() : "";
  if (!raw) return DEFAULT_BUSINESS_TIMEZONE;
  // Luxon validates IANA zones via isValid.
  const dt = DateTime.now().setZone(raw);
  return dt.isValid ? raw : DEFAULT_BUSINESS_TIMEZONE;
}

/**
 * Returns UTC instants for the given business-local timeframe boundaries.
 * All DB timestamps are stored in UTC; queries must use these UTC boundaries.
 */
export function businessUtcRangeForTimeframe(
  timeframe: BusinessTimeframe,
  businessTimezone: string,
  nowUtc = DateTime.utc(),
): { startUtc: Date; endUtc: Date } | null {
  if (timeframe === "all") return null;
  const tz = sanitizeIanaTimezone(businessTimezone);
  const nowLocal = nowUtc.setZone(tz);

  const startLocal =
    timeframe === "today"
      ? nowLocal.startOf("day")
      : timeframe === "week"
        ? nowLocal.startOf("week") // locale-based week start; set to Monday below
        : timeframe === "month"
          ? nowLocal.startOf("month")
          : nowLocal.startOf("year");

  // Force Monday-start weeks (hospitality reporting expectation).
  const startLocalFixed =
    timeframe === "week"
      ? nowLocal
          .startOf("day")
          .minus({ days: (nowLocal.weekday + 6) % 7 }) // Luxon weekday: Mon=1..Sun=7
      : startLocal;

  const endLocalFixed =
    timeframe === "today"
      ? nowLocal.endOf("day")
      : timeframe === "week"
        ? startLocalFixed.plus({ days: 6 }).endOf("day")
        : timeframe === "month"
          ? nowLocal.endOf("month")
          : nowLocal.endOf("year");

  return {
    startUtc: startLocalFixed.toUTC().toJSDate(),
    endUtc: endLocalFixed.toUTC().toJSDate(),
  };
}

/**
 * Converts a UTC timestamp into a business-local YYYY-MM-DD key.
 * Use this for per-day aggregation bins where "day" is defined in business timezone.
 */
export function businessDayKey(utcDate: Date, businessTimezone: string): string {
  const tz = sanitizeIanaTimezone(businessTimezone);
  return DateTime.fromJSDate(utcDate, { zone: "utc" }).setZone(tz).toFormat("yyyy-LL-dd");
}

/**
 * Converts business-local YYYY-MM-DD inputs into UTC instants for DB filtering.
 * The resulting range is inclusive of the entire local days.
 */
/** Goal periods use the same business-local calendar boundaries as dashboard timeframes. */
export type GoalCalendarPeriod = "daily" | "weekly" | "monthly";

export function goalPeriodToBusinessTimeframe(
  period: GoalCalendarPeriod,
): Exclude<BusinessTimeframe, "year" | "all"> {
  if (period === "daily") return "today";
  if (period === "weekly") return "week";
  return "month";
}

/** UTC range for the current goal period (identical to dashboard `today` / `week` / `month`). */
export function businessUtcRangeForGoalPeriod(
  period: GoalCalendarPeriod,
  businessTimezone: string,
  nowUtc = DateTime.utc(),
): { startUtc: Date; endUtc: Date } | null {
  return businessUtcRangeForTimeframe(
    goalPeriodToBusinessTimeframe(period),
    businessTimezone,
    nowUtc,
  );
}

/**
 * Start of the goal's calendar start date in business-local time, as a UTC instant.
 * `startDate` is stored as noon UTC on the chosen YYYY-MM-DD.
 */
export function businessUtcStartOfGoalStartDate(
  startDate: Date,
  businessTimezone: string,
): Date {
  const tz = sanitizeIanaTimezone(businessTimezone);
  const ymd = DateTime.fromJSDate(startDate, { zone: "utc" }).toFormat("yyyy-LL-dd");
  return DateTime.fromISO(ymd, { zone: tz }).startOf("day").toUTC().toJSDate();
}

/**
 * Effective tip-counting window: current business period intersected with [goalStartDate, now].
 * Period boundaries match `businessUtcRangeForTimeframe` for the mapped dashboard timeframe.
 */
export function effectiveGoalPeriodBounds(
  period: GoalCalendarPeriod,
  startDate: Date,
  businessTimezone: string,
  now = new Date(),
): { startUtc: Date; endUtc: Date } {
  const tz = sanitizeIanaTimezone(businessTimezone);
  const nowUtc = DateTime.fromJSDate(now, { zone: "utc" });
  if (!nowUtc.isValid) throw new Error("invalid now");
  const range = businessUtcRangeForGoalPeriod(period, tz, nowUtc);
  if (!range) throw new Error("unexpected goal period");
  const goalStart = businessUtcStartOfGoalStartDate(startDate, tz);
  const startUtc =
    range.startUtc.getTime() < goalStart.getTime() ? goalStart : range.startUtc;
  return { startUtc, endUtc: now };
}

/** Elapsed fraction of the current business-local goal period (0–1), for pacing. */
export function elapsedRatioInGoalPeriod(
  period: GoalCalendarPeriod,
  businessTimezone: string,
  now = new Date(),
): number {
  const tz = sanitizeIanaTimezone(businessTimezone);
  const nowUtc = DateTime.fromJSDate(now, { zone: "utc" });
  if (!nowUtc.isValid) return 1;
  const range = businessUtcRangeForGoalPeriod(period, tz, nowUtc);
  if (!range) return 1;
  const startMs = range.startUtc.getTime();
  const endMs = range.endUtc.getTime();
  const nowMs = now.getTime();
  const span = endMs - startMs;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (nowMs - startMs) / span));
}

export function businessUtcRangeForLocalDates(
  fromYmd: string | undefined,
  toYmd: string | undefined,
  businessTimezone: string,
): { startUtc: Date; endUtc: Date } | null {
  const tz = sanitizeIanaTimezone(businessTimezone);
  const fromRaw = typeof fromYmd === "string" ? fromYmd.trim() : "";
  const toRaw = typeof toYmd === "string" ? toYmd.trim() : "";
  if (!fromRaw && !toRaw) return null;

  const fromLocal = fromRaw ? DateTime.fromISO(fromRaw, { zone: tz }).startOf("day") : null;
  const toLocal = toRaw ? DateTime.fromISO(toRaw, { zone: tz }).endOf("day") : null;
  if (fromLocal && !fromLocal.isValid) return null;
  if (toLocal && !toLocal.isValid) return null;

  const startLocal = fromLocal ?? toLocal!.startOf("day");
  const endLocal = toLocal ?? fromLocal!.endOf("day");
  return { startUtc: startLocal.toUTC().toJSDate(), endUtc: endLocal.toUTC().toJSDate() };
}

