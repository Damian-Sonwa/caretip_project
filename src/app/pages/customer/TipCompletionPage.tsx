import { useNavigate, useSearchParams } from "react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Users } from "lucide-react";
import { clearCustomerFlowEntry } from "../../lib/customerFlowGuard";
import { useTipFlow } from "../../context/TipFlowContext";
import { customerFlowUi as cf } from "./customerFlowUi";
import { Card, CardContent } from "@/components/ui/card";
import { useVerifiedTipSession, isVerifiedTipSessionReady } from "../../hooks/useVerifiedTipSession";
import { TipPaymentProcessingView } from "./TipPaymentProcessingView";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { CustomerVenueBanner } from "../../components/customer/CustomerVenueBanner";
import { CustomerJourneyHeader } from "./CustomerJourneyHeader";
import { CustomerJourneyAttributionFooter } from "./CustomerJourneyCareTipAttribution";
import { useCustomerVenueBrand } from "./customerJourneyBrand";
import { headerThankYouFor } from "./customerJourneyHeaderCopy";

export function TipCompletionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { reset, businessId: tipFlowBusinessId, employeeName: tipFlowEmployeeName } = useTipFlow();

  const sessionId = searchParams.get("session_id")?.trim() ?? "";
  const feedbackSubmitted = searchParams.get("feedbackSubmitted") === "1";

  const verification = useVerifiedTipSession(sessionId);
  const businessIdForVenue =
    verification.phase === "ready" ? verification.context.businessId : tipFlowBusinessId;
  const venueBrand = useCustomerVenueBrand(businessIdForVenue, t("tipFlow.common.venue"));

  useEffect(() => {
    if (!sessionId) {
      navigate("/", { replace: true });
    }
  }, [navigate, sessionId]);

  useEffect(() => {
    if (verification.phase === "expired" || verification.phase === "unpaid" || verification.phase === "error") {
      navigate("/", { replace: true });
    }
  }, [navigate, verification.phase]);

  if (!sessionId) {
    return null;
  }

  if (verification.phase === "loading") {
    return <CareTipPageLoader variant="wait" message={t("tipFlow.loading.finishingUp")} />;
  }

  if (verification.phase === "pending") {
    return (
      <TipPaymentProcessingView
        venue={venueBrand}
        employeeName={tipFlowEmployeeName ?? undefined}
      />
    );
  }

  if (!isVerifiedTipSessionReady(verification)) {
    return null;
  }

  const { context } = verification;
  const displayName = context.employee?.name ?? t("tipFlow.common.aTeamMember");
  const businessId = context.businessId;

  const tipAnother = () => {
    clearCustomerFlowEntry();
    reset();
    if (businessId) {
      navigate(`/qr-landing/${encodeURIComponent(businessId)}`, { replace: true });
      return;
    }
    navigate("/", { replace: true });
  };

  const exit = () => {
    clearCustomerFlowEntry();
    reset();
    navigate("/", { replace: true });
  };

  const completionHeader = headerThankYouFor(t, displayName, feedbackSubmitted);
  const premiumThankYou =
    venueBrand.branding?.premium && venueBrand.branding.thankYouMessage?.trim()
      ? venueBrand.branding.thankYouMessage.trim()
      : null;

  return (
    <div className={cf.page}>
      {venueBrand.branding?.premium ? (
        <div className="border-b border-black/[0.06]">
          <CustomerVenueBanner branding={venueBrand.branding} />
        </div>
      ) : null}
      <CustomerJourneyHeader
        venue={venueBrand}
        stepTitle={completionHeader.stepTitle}
        trustMessage={completionHeader.trustMessage}
      />

      <div className={`${cf.main} max-w-lg py-10 sm:py-14`}>
        <div className={cf.successIconWrap} aria-hidden>
          <CheckCircle2 className="size-11 text-primary sm:size-12" strokeWidth={1.75} />
        </div>

        {premiumThankYou ? (
          <p className="mx-auto mb-6 max-w-md text-center text-sm leading-relaxed text-muted-foreground">
            {premiumThankYou}
          </p>
        ) : null}

        <Card className={cf.completionCard}>
          <CardContent className="p-6 sm:p-8">
            <div className={cf.completionActions}>
              <button type="button" onClick={tipAnother} className={cf.completionPrimaryBtn}>
                <Users className="size-5 shrink-0" aria-hidden />
                {t("tipFlow.completion.tipAnotherMember")}
              </button>
              <button type="button" onClick={exit} className={cf.completionTextAction}>
                {t("tipFlow.completion.exit")}
              </button>
            </div>
          </CardContent>
        </Card>

        <CustomerJourneyAttributionFooter label={t("tipFlow.common.poweredByCareTip")} />
      </div>
    </div>
  );
}
