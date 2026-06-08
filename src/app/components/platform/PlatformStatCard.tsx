import type { ReactNode } from "react";
import { DashboardMetricStatCard } from "../dashboard/DashboardMetricStatCard";
import { platformMetricTokens } from "../dashboard/dashboardMetricTokens";
import { CountUpMetric, type CountUpMetricKind } from "../dashboard/CountUpMetric";

type PlatformStatCardProps = {
  label: string;
  value: ReactNode;
  numericValue?: number;
  countUpKind?: CountUpMetricKind;
  change?: ReactNode;
  icon?: ReactNode;
  featured?: boolean;
  className?: string;
  loading?: boolean;
  loadingVariant?: "currency" | "count" | "pulse";
};

export function PlatformStatCard({
  label,
  value,
  numericValue,
  countUpKind = "integer",
  change,
  icon,
  featured,
  className,
  loading,
  loadingVariant = "count",
}: PlatformStatCardProps) {
  const displayValue =
    !loading && numericValue != null && Number.isFinite(numericValue) ? (
      <CountUpMetric value={numericValue} kind={countUpKind} />
    ) : (
      value
    );

  return (
    <DashboardMetricStatCard
      tokens={platformMetricTokens}
      label={label}
      value={displayValue}
      change={change}
      icon={icon}
      featured={featured}
      loading={loading}
      loadingVariant={loadingVariant}
      className={className}
    />
  );
}
