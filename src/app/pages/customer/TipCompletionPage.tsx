import { useNavigate, useSearchParams } from "react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle2, LogOut, Users } from "lucide-react";
import { CareTipLogo } from "../../components/CareTipLogo";
import { clearCustomerFlowEntry } from "../../lib/customerFlowGuard";
import { useTipFlow } from "../../context/TipFlowContext";
import { customerFlowUi as cf } from "./customerFlowUi";
import { Card, CardContent } from "@/components/ui/card";
import { useVerifiedTipSession, isVerifiedTipSessionReady } from "../../hooks/useVerifiedTipSession";
import { TipPaymentProcessingView } from "./TipPaymentProcessingView";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";

export function TipCompletionPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { reset } = useTipFlow();

  const sessionId = searchParams.get("session_id")?.trim() ?? "";
  const feedbackSubmitted = searchParams.get("feedbackSubmitted") === "1";

  const verification = useVerifiedTipSession(sessionId);

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
    return <CareTipPageLoader variant="wait" message={t("tipFlow.completion.processingTitle")} />;
  }

  if (verification.phase === "pending") {
    return <TipPaymentProcessingView />;
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

  return (
    <div className={cf.page}>
      <div className={cf.stickyHeader}>
        <div className={cf.headerInner}>
          <CareTipLogo size="xs" className="h-11 max-h-11 min-h-0 w-auto max-w-[5.5rem] shrink-0" />
        </div>
      </div>

      <div className={`${cf.main} max-w-lg py-10 sm:py-14`}>
        <div className={cf.successIconWrap} aria-hidden>
          <CheckCircle2 className="size-11 text-primary sm:size-12" strokeWidth={1.75} />
        </div>

        <Card className={cf.completionCard}>
          <CardContent className="space-y-6 p-6 sm:p-8">
            <div className="space-y-2.5 text-center">
              <h1 className="text-balance text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {t("tipFlow.completion.thankYouTipping", { name: displayName })}
              </h1>
              {feedbackSubmitted ? (
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t("tipFlow.completion.feedbackReceived")}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <button type="button" onClick={tipAnother} className={`${cf.btnPrimaryLg} py-3.5 text-sm`}>
                <Users className="size-5 shrink-0" aria-hidden />
                {t("tipFlow.completion.tipAnotherMember")}
              </button>
              <button type="button" onClick={exit} className={`${cf.btnSecondaryLg} py-3.5 text-sm`}>
                <LogOut className="size-5 shrink-0" aria-hidden />
                {t("tipFlow.completion.exit")}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
