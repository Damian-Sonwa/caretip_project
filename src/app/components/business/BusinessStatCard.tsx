import type { ReactNode } from "react";
import {
  DashboardMetricStatCard,
  type DashboardMetricStatCardTokens,
} from "../dashboard/DashboardMetricStatCard";
import { businessUi } from "./businessDashboardUi";

const businessMetricTokens: DashboardMetricStatCardTokens = {
  statCard: businessUi.statCard,
  statLabel: businessUi.statLabel,
  statValue: businessUi.statValue,
  statChange: businessUi.statChange,
  featuredClass: "business-stat-card--featured",
  labelRowClass: "business-stat-card__label-row",
  valueClass: "business-stat-card__value",
  changeClass: "business-stat-card__change",
};

type BusinessStatCardProps = {
  label: string;
  value: ReactNode;
  change?: ReactNode;
  icon?: ReactNode;
  featured?: boolean;
  className?: string;
  loading?: boolean;
};

export function BusinessStatCard(props: BusinessStatCardProps) {
  return <DashboardMetricStatCard tokens={businessMetricTokens} {...props} />;
}
