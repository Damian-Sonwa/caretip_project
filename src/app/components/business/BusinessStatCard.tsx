import type { ReactNode } from "react";
import { DashboardMetricStatCard } from "../dashboard/DashboardMetricStatCard";
import { businessMetricTokens } from "../dashboard/dashboardMetricTokens";

type BusinessStatCardProps = {
  label: string;
  value: ReactNode;
  change?: ReactNode;
  icon?: ReactNode;
  featured?: boolean;
  className?: string;
  loading?: boolean;
  refreshing?: boolean;
  refreshingLabel?: ReactNode;
  showSpinner?: boolean;
  loadingVariant?: "currency" | "count" | "pulse";
};

export function BusinessStatCard(props: BusinessStatCardProps) {
  return <DashboardMetricStatCard tokens={businessMetricTokens} {...props} />;
}
