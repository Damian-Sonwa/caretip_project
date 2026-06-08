import { CheckCircle2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { customerFlowUi as cf } from "@/app/pages/customer/customerFlowUi";

export type TipFlowCompletionCardProps = {
  tippedName?: string;
  feedbackSubmitted?: boolean;
  onBackToVenue: () => void;
  onTipAnother: () => void;
};

export function TipFlowCompletionCard({
  tippedName,
  feedbackSubmitted,
  onBackToVenue,
  onTipAnother,
}: TipFlowCompletionCardProps) {
  const { t } = useTranslation();

  const summaryKey = feedbackSubmitted
    ? tippedName
      ? "tipFlow.qrLanding.completionSummaryFeedbackNamed"
      : "tipFlow.qrLanding.completionSummaryFeedback"
    : tippedName
      ? "tipFlow.qrLanding.completionSummaryNamed"
      : "tipFlow.qrLanding.completionSummary";

  return (
    <Card className={`${cf.cardAccentWash} border-primary/20`}>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div className="min-w-0 space-y-1">
            <h2 className="text-base font-semibold tracking-tight text-foreground">
              {t("tipFlow.qrLanding.completionTitle")}
            </h2>
            <p className="text-sm leading-snug text-muted-foreground">
              {tippedName ? t(summaryKey, { name: tippedName }) : t(summaryKey)}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <button type="button" onClick={onBackToVenue} className={`${cf.btnSecondaryLg} py-3.5 text-sm sm:flex-1`}>
            {t("tipFlow.qrLanding.backToVenue")}
          </button>
          <button type="button" onClick={onTipAnother} className={`${cf.btnPrimaryLg} py-3.5 text-sm sm:flex-1`}>
            {t("tipFlow.qrLanding.tipAnotherMember")}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
