import type { ReactNode } from "react";
import { DashboardWorkspaceEmptyState } from "../dashboard/DashboardWorkspaceEmptyState";
import { cn } from "@/lib/utils";

type EmployeeEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

export function EmployeeEmptyState(props: EmployeeEmptyStateProps) {
  return (
    <DashboardWorkspaceEmptyState
      icon={props.icon}
      title={props.title}
      description={props.description}
      action={props.action}
      compact={props.compact}
      className={cn(props.className)}
    />
  );
}
