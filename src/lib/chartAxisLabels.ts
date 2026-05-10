import type { TFunction } from "i18next";

type WeekdayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
type MonthKey =
  | "jan"
  | "feb"
  | "mar"
  | "apr"
  | "may"
  | "jun"
  | "jul"
  | "aug"
  | "sep"
  | "oct"
  | "nov"
  | "dec";

function stripDots(s: string): string {
  return s.trim().replace(/\.+$/g, "").trim();
}

/** Map server / Luxon weekday tokens to i18n keys (EN + DE + full names). */
const WEEKDAY_TOKEN_TO_KEY: Record<string, WeekdayKey> = {
  mon: "mon",
  mo: "mon",
  monday: "mon",
  tue: "tue",
  tu: "tue",
  tuesday: "tue",
  di: "tue",
  wed: "wed",
  we: "wed",
  wednesday: "wed",
  mi: "wed",
  thu: "thu",
  th: "thu",
  thursday: "thu",
  do: "thu",
  fri: "fri",
  fr: "fri",
  friday: "fri",
  sat: "sat",
  sa: "sat",
  saturday: "sat",
  sun: "sun",
  su: "sun",
  sunday: "sun",
  so: "sun",
};

function weekdayKeyFromLabel(raw: string): WeekdayKey | null {
  const n = stripDots(raw);
  if (!n) return null;
  return WEEKDAY_TOKEN_TO_KEY[n.toLowerCase()] ?? null;
}

export function translateChartWeekdayLabel(raw: string, t: TFunction): string {
  const key = weekdayKeyFromLabel(raw);
  if (!key) return raw;
  return t(`charts.weekdayShort.${key}`);
}

const MONTH_TOKEN_TO_KEY: Record<string, MonthKey> = {
  jan: "jan",
  feb: "feb",
  mar: "mar",
  apr: "apr",
  may: "may",
  jun: "jun",
  jul: "jul",
  aug: "aug",
  sep: "sep",
  sept: "sep",
  oct: "oct",
  nov: "nov",
  dec: "dec",
};

export function translateChartMonthLabel(raw: string, t: TFunction): string {
  const n = stripDots(raw);
  const key = MONTH_TOKEN_TO_KEY[n.toLowerCase()];
  if (!key) return raw;
  return t(`charts.monthShort.${key}`);
}
