import { prisma } from "../../prisma.js";

export type RetentionRiskLevel = "low" | "medium" | "high";

export type RetentionSignal = {
  id: string;
  reasonCode: string;
  evidence: Record<string, string | number>;
  sourceKpi: string;
  calculationPath: string;
  severity: RetentionRiskLevel;
};

export type BusinessRetentionInsights = {
  level: RetentionRiskLevel;
  signals: RetentionSignal[];
};

async function tipVolumeChange(businessId: string): Promise<{ current: number; previous: number; pct: number }> {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [current, previous] = await Promise.all([
    prisma.transaction.count({
      where: { businessId, status: "success", createdAt: { gte: d30 } },
    }),
    prisma.transaction.count({
      where: { businessId, status: "success", createdAt: { gte: d60, lt: d30 } },
    }),
  ]);

  const pct =
    previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;
  return { current, previous, pct };
}

async function qrScanChange(businessId: string): Promise<{ current: number; previous: number; pct: number }> {
  const now = new Date();
  const d30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const d60 = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  const [current, previous] = await Promise.all([
    prisma.qrScanEvent.count({ where: { businessId, scannedAt: { gte: d30 } } }),
    prisma.qrScanEvent.count({ where: { businessId, scannedAt: { gte: d60, lt: d30 } } }),
  ]);

  const pct =
    previous > 0 ? Math.round(((current - previous) / previous) * 100) : current > 0 ? 100 : 0;
  return { current, previous, pct };
}

/** Sprint 7D — evidence-based churn risk (no black-box scoring). */
export async function getBusinessRetentionInsights(businessId: string): Promise<BusinessRetentionInsights> {
  const signals: RetentionSignal[] = [];

  const [business, tips, qr, subscription] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: {
        subscriptionTier: true,
        user: { select: { hasCompletedOnboarding: true, createdAt: true } },
      },
    }),
    tipVolumeChange(businessId),
    qrScanChange(businessId),
    prisma.subscription.findUnique({
      where: { businessId },
      select: {
        status: true,
        cancelAtPeriodEnd: true,
        cancellationEffective: true,
        canceledAt: true,
      },
    }),
  ]);

  if (!business) {
    return { level: "low", signals: [] };
  }

  if (subscription?.cancelAtPeriodEnd) {
    signals.push({
      id: "cancel-scheduled",
      reasonCode: "cancel_at_period_end",
      evidence: {
        effective: subscription.cancellationEffective?.toISOString().slice(0, 10) ?? "period_end",
      },
      sourceKpi: "subscription.cancelAtPeriodEnd",
      calculationPath: "cancelAtPeriodEnd === true",
      severity: "high",
    });
  }

  if (subscription?.status === "past_due" || subscription?.status === "unpaid") {
    signals.push({
      id: "payment-issue",
      reasonCode: "payment_past_due",
      evidence: { status: subscription.status },
      sourceKpi: "subscription.status",
      calculationPath: "status in (past_due, unpaid)",
      severity: "high",
    });
  }

  if (!business.user.hasCompletedOnboarding) {
    const ageDays = Math.floor(
      (Date.now() - business.user.createdAt.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (ageDays >= 7) {
      signals.push({
        id: "onboarding-incomplete",
        reasonCode: "abandoned_onboarding",
        evidence: { days: ageDays },
        sourceKpi: "user.hasCompletedOnboarding",
        calculationPath: "onboarding incomplete AND business age >= 7 days",
        severity: ageDays >= 14 ? "high" : "medium",
      });
    }
  }

  if (tips.previous > 0 && tips.pct <= -30) {
    signals.push({
      id: "tips-declining",
      reasonCode: "tips_decline",
      evidence: { percent: tips.pct, current: tips.current, previous: tips.previous },
      sourceKpi: "tips.count",
      calculationPath: "(tips last 30d - prior 30d) / prior 30d * 100 <= -30",
      severity: tips.pct <= -50 ? "high" : "medium",
    });
  }

  if (qr.previous > 5 && qr.pct <= -30) {
    signals.push({
      id: "qr-declining",
      reasonCode: "qr_scans_decline",
      evidence: { percent: qr.pct, current: qr.current, previous: qr.previous },
      sourceKpi: "qr_scan_events.count",
      calculationPath: "(scans last 30d - prior 30d) / prior 30d * 100 <= -30",
      severity: qr.pct <= -50 ? "high" : "medium",
    });
  }

  if (tips.current === 0 && tips.previous === 0) {
    const staffCount = await prisma.employee.count({
      where: { businessId, isDeleted: false, isActive: true },
    });
    if (staffCount > 0) {
      signals.push({
        id: "no-activity",
        reasonCode: "no_tip_activity",
        evidence: { staffCount },
        sourceKpi: "tips.count",
        calculationPath: "0 tips in 60d with active staff",
        severity: "medium",
      });
    }
  }

  const maxSeverity = signals.reduce<RetentionRiskLevel>(
    (max, s) => {
      if (s.severity === "high") return "high";
      if (s.severity === "medium" && max !== "high") return "medium";
      return max;
    },
    "low",
  );

  return { level: signals.length === 0 ? "low" : maxSeverity, signals: signals.slice(0, 6) };
}
