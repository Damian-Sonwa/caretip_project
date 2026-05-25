import type { ReactNode } from "react";
import {
  DashboardMetricStatCard,
  type DashboardMetricStatCardTokens,
} from "../dashboard/DashboardMetricStatCard";
import { employeeUi } from "./employeeDashboardUi";

const employeeMetricTokens: DashboardMetricStatCardTokens = {
  statCard: employeeUi.statCard,
  statLabel: employeeUi.statLabel,
  statValue: employeeUi.statValue,
  statChange: employeeUi.statChange,
  featuredClass: "employee-stat-card--featured",
  labelRowClass: "employee-stat-card__label-row",
  valueClass: "employee-stat-card__value",
  changeClass: "employee-stat-card__change",
};

type EmployeeStatCardProps = {
  label: string;
  value: ReactNode;
  change?: ReactNode;
  icon?: ReactNode;
  featured?: boolean;
  className?: string;
  loading?: boolean;
};

export function EmployeeStatCard(props: EmployeeStatCardProps) {
  return <DashboardMetricStatCard tokens={employeeMetricTokens} {...props} />;
}
