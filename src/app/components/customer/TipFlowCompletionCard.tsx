import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { customerFlowUi as cf } from "@/app/pages/customer/customerFlowUi";

export type TipFlowCompletionCardProps = {
  onBackToVenue: () => void;
  onTipAnother: () => void;
};

export function TipFlowCompletionCard({ onBackToVenue, onTipAnother }: TipFlowCompletionCardProps) {
  const { t } = useTranslation();

  return (
    <Card className={cf.cardMuted}>
      <CardContent className="flex flex-col gap-2.5 p-5 sm:flex-row sm:p-6">
        <button type="button" onClick={onBackToVenue} className={`${cf.btnSecondaryLg} py-3.5 text-sm sm:flex-1`}>
          {t("tipFlow.qrLanding.backToVenue")}
        </button>
        <button type="button" onClick={onTipAnother} className={`${cf.btnPrimaryLg} py-3.5 text-sm sm:flex-1`}>
          {t("tipFlow.qrLanding.tipAnotherMember")}
        </button>
      </CardContent>
    </Card>
  );
}
