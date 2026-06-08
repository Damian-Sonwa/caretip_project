import { CheckCircle2, MessageSquareHeart } from "lucide-react";
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

  return (
    <Card className={`${cf.cardAccentWash} border-primary/25`}>
      <CardContent className="space-y-4 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/12 text-primary ring-1 ring-primary/20"
            aria-hidden
          >
            <CheckCircle2 className="size-6" />
          </div>
          <div className="min-w-0 space-y-1">
            <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
              {t("tipFlow.qrLanding.completionTitle")}
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {tippedName
                ? t("tipFlow.qrLanding.completionTipSentNamed", { name: tippedName })
                : t("tipFlow.qrLanding.completionTipSent")}
            </p>
            {feedbackSubmitted ? (
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
                <MessageSquareHeart className="size-3.5 shrink-0" aria-hidden />
                {t("tipFlow.qrLanding.completionFeedbackSent")}
              </p>
            ) : null}
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
