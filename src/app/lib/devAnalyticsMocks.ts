type BusinessTimeframe = "week" | "month" | "year";
type EmployeeTimeframe = "today" | "week" | "month";

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function sum(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0);
}

/** Monday-first weekday labels used across charts. */
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Realistic but deterministic “shape” for a week: builds toward weekend. */
const BASE_WEEK_AMOUNTS = [20, 35, 18, 50, 70, 90, 65] as const;

export function devMockBusinessTipDistribution(
  timeframe: BusinessTimeframe,
): Array<{ day: string; amount: number }> {
  if (timeframe === "week") {
    return WEEKDAYS.map((day, i) => ({ day, amount: BASE_WEEK_AMOUNTS[i] }));
  }

  if (timeframe === "year") {
    // Seasonal variation + summer peak (EUR-ish magnitude; UI formats anyway).
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const amounts = [820, 910, 980, 1120, 1350, 1620, 1880, 1760, 1490, 1280, 1170, 980];
    return months.map((m, i) => ({ day: m, amount: amounts[i] }));
  }

  // month: 28–31 buckets → render a “current month” style curve.
  const days = 30;
  const points: Array<{ day: string; amount: number }> = [];
  for (let d = 1; d <= days; d++) {
    // Mid-month pickup + weekend spikes.
    const weekendBoost = d % 7 === 6 || d % 7 === 0 ? 1.35 : 1.0;
    const mid = 1 + Math.sin(((d - 8) / days) * Math.PI) * 0.35;
    const amt = Math.round(clamp(42 * mid * weekendBoost + (d % 5) * 2, 8, 120));
    points.push({ day: String(d), amount: amt });
  }
  return points;
}

export function devMockBusinessEmployeePerformance(
  colors: string[],
): Array<{ name: string; tips: number; rating: number; color: string }> {
  const employees = [
    { name: "Maya C.", tips: 420, rating: 4.9 },
    { name: "James O.", tips: 355, rating: 4.7 },
    { name: "Sofia R.", tips: 310, rating: 4.8 },
    { name: "Alex K.", tips: 245, rating: 4.6 },
    { name: "Front desk", tips: 510, rating: 4.5 },
  ];
  return employees
    .slice()
    .sort((a, b) => b.tips - a.tips)
    .map((e, i) => ({
      name: e.name,
      tips: e.tips,
      rating: e.rating,
      color: colors[i % colors.length] ?? "#e9932f",
    }));
}

export function devMockEmployeeEarningsTimeline(
  timeframe: EmployeeTimeframe,
): Array<{ time: string; amount: number }> {
  if (timeframe === "today") {
    // Sparse hours with a lunch + dinner rush.
    const hours = [9, 11, 12, 13, 18, 19, 20, 21];
    const amounts = [0, 12, 24, 18, 35, 48, 41, 22];
    const byHour = new Array(24).fill(0);
    for (let i = 0; i < hours.length; i++) byHour[hours[i]] = amounts[i];
    return byHour.map((amount, hour) => ({ time: `${hour}:00`, amount }));
  }

  if (timeframe === "week") {
    const amounts = BASE_WEEK_AMOUNTS.map((v) => Math.round(v * 0.75));
    return WEEKDAYS.map((d, i) => ({ time: d, amount: amounts[i] }));
  }

  // month → 5 week-buckets like EmployeeDashboard already expects
  const buckets = [
    { time: "3/12", amount: 140 },
    { time: "3/18", amount: 220 },
    { time: "3/24", amount: 185 },
    { time: "3/30", amount: 265 },
    { time: "4/5", amount: 240 },
  ];
  return buckets;
}

export function devMockEmployeeSummary(timeframe: EmployeeTimeframe): {
  amount: number;
  tips: number;
  avgTip: number;
} {
  const series = devMockEmployeeEarningsTimeline(timeframe).map((p) => p.amount);
  const total = sum(series);
  // Reasonable “count” approximation for preview purposes only.
  const tips = timeframe === "today" ? 7 : timeframe === "week" ? 18 : 42;
  const avgTip = tips > 0 ? total / tips : 0;
  return { amount: total, tips, avgTip };
}

