import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { CareTipLogo } from "../../components/CareTipLogo";
import { customerFlowUi as cf } from "./customerFlowUi";
import { Card, CardContent } from "@/components/ui/card";

type TipPaymentProcessingViewProps = {
  title?: string;
  subtitle?: string;
};

/** Neutral post-checkout state while the backend confirms Stripe payment. */
export function TipPaymentProcessingView({ title, subtitle }: TipPaymentProcessingViewProps) {
  const { t } = useTranslation();

  return (
    <div className={cf.page}>
      <div className={cf.stickyHeader}>
        <div className={cf.headerInner}>
          <CareTipLogo size="xs" className="h-11 max-h-11 min-h-0 w-auto max-w-[5.5rem] shrink-0" />
        </div>
      </div>

      <div className={`${cf.main} max-w-lg py-10 sm:py-14`}>
        <Card className={cf.completionCard}>
          <CardContent className="space-y-5 p-6 text-center sm:p-8">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-muted">
              <Loader2 className="size-7 animate-spin text-primary" aria-hidden />
            </div>
            <div className="space-y-2">
              <h1 className="text-balance text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                {title ?? t("tipFlow.completion.processingTitle")}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {subtitle ?? t("tipFlow.completion.processingSubtitle")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
