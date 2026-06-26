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
export function computeRetentionInsightsFromFacts(facts: {
  hasCompletedOnboarding: boolean;
  userCreatedAt: Date | null;
  subscription: {
    status: string;
    cancelAtPeriodEnd: boolean;
    cancellationEffective: Date | null;
    canceledAt: Date | null;
  } | null;
  tips30d: number;
  tipsPrior30d: number;
  qr30d: number;
  qrPrior30d: number;
  staffCount: number;
}): BusinessRetentionInsights {
  const signals: RetentionSignal[] = [];
  const tips = {
    current: facts.tips30d,
    previous: facts.tipsPrior30d,
    pct:
      facts.tipsPrior30d > 0
        ? Math.round(((facts.tips30d - facts.tipsPrior30d) / facts.tipsPrior30d) * 100)
        : facts.tips30d > 0
          ? 100
          : 0,
  };
  const qr = {
    current: facts.qr30d,
    previous: facts.qrPrior30d,
    pct:
      facts.qrPrior30d > 0
        ? Math.round(((facts.qr30d - facts.qrPrior30d) / facts.qrPrior30d) * 100)
        : facts.qr30d > 0
          ? 100
          : 0,
  };
  const subscription = facts.subscription;

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

  if (!facts.hasCompletedOnboarding && facts.userCreatedAt) {
    const ageDays = Math.floor(
      (Date.now() - facts.userCreatedAt.getTime()) / (24 * 60 * 60 * 1000),
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

  if (tips.current === 0 && tips.previous === 0 && facts.staffCount > 0) {
    signals.push({
      id: "no-activity",
      reasonCode: "no_tip_activity",
      evidence: { staffCount: facts.staffCount },
      sourceKpi: "tips.count",
      calculationPath: "0 tips in 60d with active staff",
      severity: "medium",
    });
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

/** Sprint 7D — evidence-based churn risk (no black-box scoring). */
export async function getBusinessRetentionInsights(businessId: string): Promise<BusinessRetentionInsights> {
  const [business, tips, qr, subscription, staffCount] = await Promise.all([
    prisma.business.findUnique({
      where: { id: businessId },
      select: {
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
    prisma.employee.count({
      where: { businessId, isDeleted: false, isActive: true },
    }),
  ]);

  if (!business) {
    return { level: "low", signals: [] };
  }

  return computeRetentionInsightsFromFacts({
    hasCompletedOnboarding: business.user?.hasCompletedOnboarding ?? true,
    userCreatedAt: business.user?.createdAt ?? null,
    subscription: subscription ?? null,
    tips30d: tips.current,
    tipsPrior30d: tips.previous,
    qr30d: qr.current,
    qrPrior30d: qr.previous,
    staffCount,
  });
}
