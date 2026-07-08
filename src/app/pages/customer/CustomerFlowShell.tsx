import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { customerFlowUi as cf } from "./customerFlowUi";
import { CustomerJourneyHeader } from "./CustomerJourneyHeader";
import { CustomerJourneyCareTipAttribution } from "./CustomerJourneyCareTipAttribution";
import type { CustomerJourneyEmployeeIdentity, CustomerJourneyVenueBrand } from "./customerJourneyBrand";
import {
  APP_LOADING_PRIORITY,
  useAppLoadingRegistration,
} from "@/app/context/AppLoadingManager";
import { GlobalAppLoadingHold } from "@/app/components/GlobalAppLoadingHold";
import type { AppLoadingContext } from "@/app/lib/appLoadingContexts";
import { resolveAppLoadingContextMessage } from "@/app/lib/appLoadingContexts";

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
  loadingContext?: AppLoadingContext;
  loadingRegistrationKey?: string;
  withBottomCta?: boolean;
  className?: string;
  mainClassName?: string;
  children?: ReactNode;
  bottomBar?: ReactNode;
};

/**
 * Persistent customer journey shell — header stays mounted while body loads.
 * Full-page async work uses the global branded overlay (not inline spinners).
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
  loadingContext = "checkout",
  loadingRegistrationKey = "customer-flow-shell",
  withBottomCta = false,
  className,
  mainClassName,
  children,
  bottomBar,
}: CustomerFlowShellProps) {
  const { t } = useTranslation();
  const overlayMessage =
    loadingMessage ??
    resolveAppLoadingContextMessage(loadingContext, t);

  useAppLoadingRegistration(
    loadingRegistrationKey,
    APP_LOADING_PRIORITY.ROUTE_GUARD,
    loading,
    overlayMessage,
  );

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
          <GlobalAppLoadingHold className="min-h-[40vh] py-16 sm:py-20" />
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
