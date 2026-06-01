import type { ReactNode } from "react";
import { EmptyState } from "../ui/EmptyState";
import { cn } from "@/lib/utils";

type EmployeeEmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

/** @deprecated Prefer `EmptyState` — kept for existing dashboard imports. */
export function EmployeeEmptyState(props: EmployeeEmptyStateProps) {
  return (
    <EmptyState
      icon={props.icon}
      title={props.title}
      description={props.description}
      action={props.action}
      compact={props.compact}
      className={cn(props.className)}
    />
  );
}
