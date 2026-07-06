import type { ReactNode } from "react";
import { DashboardMetricStatCard } from "../dashboard/DashboardMetricStatCard";
import { employeeMetricTokens } from "../dashboard/dashboardMetricTokens";

type EmployeeStatCardProps = {
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

export function EmployeeStatCard(props: EmployeeStatCardProps) {
  return <DashboardMetricStatCard tokens={employeeMetricTokens} {...props} />;
}
