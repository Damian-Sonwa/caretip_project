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

