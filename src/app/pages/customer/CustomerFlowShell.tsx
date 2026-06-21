import type { ReactNode } from "react";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { customerFlowUi as cf } from "./customerFlowUi";

type CustomerFlowShellProps = {
  headerLeading?: ReactNode;
  headerLogo?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  headerTrailing?: ReactNode;
  loading?: boolean;
  loadingMessage?: string;
  withBottomCta?: boolean;
  className?: string;
  mainClassName?: string;
  children?: ReactNode;
  bottomBar?: ReactNode;
};

/**
 * Persistent customer journey shell — header stays mounted while body loads.
 * Avoids full-screen loader → content swaps that flash during guard/hydration.
 */
export function CustomerFlowShell({
  headerLeading,
  headerLogo,
  title,
  subtitle,
  headerTrailing,
  loading = false,
  loadingMessage,
  withBottomCta = false,
  className,
  mainClassName,
  children,
  bottomBar,
}: CustomerFlowShellProps) {
  return (
    <div className={cn(withBottomCta ? cf.pageWithBottomCta : cf.page, className)}>
      <div className={cf.stickyHeader}>
        <div className={cn(cf.headerInner, headerTrailing ? "relative" : undefined)}>
          {headerLeading}
          {headerLogo}
          <div className="min-w-0 flex-1">
            <h1 className={cf.headline}>{title}</h1>
            {subtitle ? <div className={cf.subline}>{subtitle}</div> : null}
          </div>
          {headerTrailing}
        </div>
      </div>

      <div className={cn(cf.main, mainClassName)}>
        {loading ? (
          <div
            className="flex flex-col items-center justify-center gap-4 py-16 sm:py-20"
            role="status"
            aria-busy="true"
            aria-live="polite"
          >
            <LoadingSpinner size="lg" />
            {loadingMessage ? (
              <p className="max-w-sm text-center text-sm text-muted-foreground">{loadingMessage}</p>
            ) : null}
          </div>
        ) : (
          children
        )}
      </div>

      {!loading ? bottomBar : null}
    </div>
  );
}
