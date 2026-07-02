import type { ReactNode } from "react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type DashboardViewAllLinkProps = {
  to: string;
  children: ReactNode;
  className?: string;
};

/** Consistent tertiary “View all →” affordance on dashboard section headers. */
export function DashboardViewAllLink({ to, children, className }: DashboardViewAllLinkProps) {
  return (
    <Link to={to} className={cn("dashboard-view-all-link", className)}>
      <span>{children}</span>
      <ArrowRight className="dashboard-view-all-link__icon" strokeWidth={2} aria-hidden />
    </Link>
  );
}
