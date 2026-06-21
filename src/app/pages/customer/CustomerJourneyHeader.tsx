import type { ReactNode } from "react";
import { Check, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { BusinessLogoMark } from "../../components/business/BusinessLogoMark";
import { customerFlowUi as cf } from "./customerFlowUi";
import type { CustomerJourneyEmployeeIdentity, CustomerJourneyVenueBrand } from "./customerJourneyBrand";

export type CustomerJourneyHeaderProps = {
  leading?: ReactNode;
  trailing?: ReactNode;
  /** Primary — venue logo + name. */
  venue: CustomerJourneyVenueBrand;
  /** Secondary — unified action line (include recipient name here when known). */
  stepTitle?: string;
  /** Optional role/context — only when not already in stepTitle (prefer trustMessage). */
  employee?: CustomerJourneyEmployeeIdentity;
  /** Instructional / trust copy — muted, never duplicates stepTitle. */
  trustMessage?: ReactNode;
  className?: string;
};

export function CustomerJourneyTrustMessage({ children }: { children: ReactNode }) {
  return (
    <span className={cf.customerJourneyTrust}>
      <Check className="size-3.5 shrink-0 stroke-[2.5] text-emerald-600/75 dark:text-emerald-500/80" aria-hidden />
      <span>{children}</span>
    </span>
  );
}

export function CustomerJourneyBackButton({
  label,
  onClick,
  disabled,
  className,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(cf.backButton, className)}
    >
      {label}
    </button>
  );
}

export function CustomerJourneyHomeButton({
  ariaLabel,
  onClick,
  className,
}: {
  ariaLabel: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(cf.backButton, "px-2.5", className)}
      aria-label={ariaLabel}
    >
      <Home className="size-5 text-foreground" aria-hidden />
    </button>
  );
}

export function CustomerJourneySkipButton({
  label,
  ariaLabel,
  onClick,
  className,
}: {
  label: string;
  ariaLabel: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex min-h-[2.75rem] shrink-0 items-center justify-center rounded-xl px-2 text-sm font-medium text-muted-foreground/90 transition-colors duration-150 hover:text-foreground",
        className,
      )}
      aria-label={ariaLabel}
    >
      {label}
    </button>
  );
}

/**
 * Customer journey header — venue → unified step line → supporting hint.
 * Recipient name belongs in stepTitle (e.g. "Choose tip amount for Marco Rossi"), not a separate line.
 */
export function CustomerJourneyHeader({
  leading,
  trailing,
  venue,
  employee,
  stepTitle,
  trustMessage,
  className,
}: CustomerJourneyHeaderProps) {
  const employeeLine = employee
    ? employee.role?.trim()
      ? `${employee.name} · ${employee.role.trim()}`
      : employee.name
    : null;

  return (
    <div className={cf.stickyHeader}>
      <div className={cn(cf.customerJourneyHeader, className)}>
        {(leading || trailing) && (
          <div className={cf.customerJourneyToolbar}>
            <div className={cn(cf.customerJourneyToolbarSide, "justify-start")}>{leading ?? null}</div>
            <div className={cn(cf.customerJourneyToolbarSide, "justify-end")}>{trailing ?? null}</div>
          </div>
        )}

        <div className={cf.customerJourneyVenueRow}>
          <BusinessLogoMark
            logoPathOrUrl={venue.logo ?? null}
            businessName={venue.name}
            size="header"
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h1 className={cf.customerJourneyVenueName}>{venue.name}</h1>
            {venue.contextLine ? (
              <div className={cf.customerJourneyVenueContext}>{venue.contextLine}</div>
            ) : null}
          </div>
        </div>

        {stepTitle ? <h2 className={cf.customerJourneyStepTitle}>{stepTitle}</h2> : null}

        {employeeLine ? <p className={cf.customerJourneyEmployee}>{employeeLine}</p> : null}

        {trustMessage ? (
          <div className={cf.customerJourneyTrustWrap}>
            {typeof trustMessage === "string" ? (
              <span className={cf.customerJourneyTrust}>{trustMessage}</span>
            ) : (
              trustMessage
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
