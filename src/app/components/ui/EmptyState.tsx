import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { emptyStateUi } from "./emptyStateUi";

export type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
};

/**
 * Reusable guided empty state: what happened, why empty, what to do next.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(emptyStateUi.wrap, compact && emptyStateUi.compact, className)}
      role="status"
    >
      {icon ? <div className={emptyStateUi.icon}>{icon}</div> : null}
      <p className={emptyStateUi.title}>{title}</p>
      {description ? <p className={emptyStateUi.description}>{description}</p> : null}
      {action ? <div className={emptyStateUi.action}>{action}</div> : null}
    </div>
  );
}
