import type { ReactNode } from "react";
import { PremiumEmptyState } from "../premium/PremiumEmptyState";
import { cn } from "@/lib/utils";

type EmployeeEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

/** @deprecated Prefer `PremiumEmptyState` — kept for existing dashboard imports. */
export function EmployeeEmptyState(props: EmployeeEmptyStateProps) {
  return (
    <PremiumEmptyState
      icon={props.icon}
      title={props.title}
      description={props.description}
      action={props.action}
      compact={props.compact}
      className={cn(props.className)}
    />
  );
}
