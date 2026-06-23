import type { BusinessDashboardStats } from "../api";
import type { AnalyticsPeriodSnapshot } from "./types";

export function snapshotFromStats(
  stats: BusinessDashboardStats | null | undefined,
): AnalyticsPeriodSnapshot {
  const totalTips = stats?.totalTips ?? 0;
  const tipCount = stats?.tipCount ?? 0;
  return {
    totalTips,
    tipCount,
    averageTip: tipCount > 0 ? totalTips / tipCount : 0,
  };
}

export const EMPTY_PERIOD_SNAPSHOT: AnalyticsPeriodSnapshot = {
  totalTips: 0,
  tipCount: 0,
  averageTip: 0,
};

export function todaySnapshotFromPulse(
  pulse: BusinessDashboardStats["operationalPulse"] | null | undefined,
): AnalyticsPeriodSnapshot {
  const count = pulse?.tipsToday.count ?? 0;
  const amount = pulse?.tipsToday.amount ?? 0;
  return {
    totalTips: amount,
    tipCount: count,
    averageTip: count > 0 ? amount / count : 0,
  };
}
