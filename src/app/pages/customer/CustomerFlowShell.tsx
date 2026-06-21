import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { LoadingSpinner } from "@/app/components/ui/loading-spinner";
import { cn } from "@/lib/utils";
import { customerFlowUi as cf } from "./customerFlowUi";
import { CustomerJourneyHeader } from "./CustomerJourneyHeader";
import { CustomerJourneyCareTipAttribution } from "./CustomerJourneyCareTipAttribution";
import type { CustomerJourneyEmployeeIdentity, CustomerJourneyVenueBrand } from "./customerJourneyBrand";

type CustomerFlowShellProps = {
  headerLeading?: ReactNode;
  headerTrailing?: ReactNode;
  venue: CustomerJourneyVenueBrand;
  employee?: CustomerJourneyEmployeeIdentity;
  stepTitle?: string;
  trustMessage?: ReactNode;
  showCareTipAttribution?: boolean;
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
 */
export function CustomerFlowShell({
  headerLeading,
  venue,
  employee,
  stepTitle,
  trustMessage,
  showCareTipAttribution = true,
  headerTrailing,
  loading = false,
  loadingMessage,
  withBottomCta = false,
  className,
  mainClassName,
  children,
  bottomBar,
}: CustomerFlowShellProps) {
  const { t } = useTranslation();

  return (
    <div className={cn(withBottomCta ? cf.pageWithBottomCta : cf.page, className)}>
      <CustomerJourneyHeader
        leading={headerLeading}
        trailing={headerTrailing}
        venue={venue}
        employee={employee}
        stepTitle={stepTitle}
        trustMessage={trustMessage}
      />

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

        {!loading && showCareTipAttribution ? (
          <div className="pt-6 sm:pt-8">
            <CustomerJourneyCareTipAttribution label={t("tipFlow.common.poweredByCareTip")} />
          </div>
        ) : null}
      </div>

      {!loading ? bottomBar : null}
    </div>
  );
}
