import { useTranslation } from "react-i18next";
import type { HowItWorksStepExtras } from "@/components/public/howItWorksFlow";
import {
  HowItWorksInsetPanel,
  HowItWorksMiniCard,
  HowItWorksMiniGrid,
  HowItWorksStatCard,
  HowItWorksStatGrid,
} from "@/components/public/HowItWorksTimelineStep";

type HowItWorksStepContentProps = {
  step: number;
  extras: HowItWorksStepExtras;
};

export function HowItWorksStepContent({ step, extras }: HowItWorksStepContentProps) {
  const { t } = useTranslation();
  const n = step;

  return (
    <>
      <p>{t(`staticPages.howItWorks.s${n}Body`)}</p>

      {extras === "tip" ? (
        <HowItWorksInsetPanel>
          <strong className="text-neutral-900 dark:text-neutral-50">{t(`staticPages.howItWorks.s${n}TipLabel`)}</strong>{" "}
          {t(`staticPages.howItWorks.s${n}TipBody`)}
        </HowItWorksInsetPanel>
      ) : null}

      {extras === "chips3" ? (
        <HowItWorksMiniGrid>
          <HowItWorksMiniCard title={t(`staticPages.howItWorks.s${n}chip1t`)} subtitle={t(`staticPages.howItWorks.s${n}chip1s`)} />
          <HowItWorksMiniCard title={t(`staticPages.howItWorks.s${n}chip2t`)} subtitle={t(`staticPages.howItWorks.s${n}chip2s`)} />
          <HowItWorksMiniCard title={t(`staticPages.howItWorks.s${n}chip3t`)} subtitle={t(`staticPages.howItWorks.s${n}chip3s`)} />
        </HowItWorksMiniGrid>
      ) : null}

      {extras === "guest" ? (
        <HowItWorksInsetPanel>
          <strong className="text-neutral-900 dark:text-neutral-50">{t(`staticPages.howItWorks.s${n}GuestLabel`)}</strong>{" "}
          {t(`staticPages.howItWorks.s${n}GuestBody`)}
        </HowItWorksInsetPanel>
      ) : null}

      {extras === "employeeStats" || extras === "managerStats" || extras === "payoutStats" || extras === "growthStats" ? (
        <HowItWorksStatGrid>
          <HowItWorksStatCard value={t(`staticPages.howItWorks.s${n}stat1t`)} label={t(`staticPages.howItWorks.s${n}stat1s`)} />
          <HowItWorksStatCard value={t(`staticPages.howItWorks.s${n}stat2t`)} label={t(`staticPages.howItWorks.s${n}stat2s`)} />
        </HowItWorksStatGrid>
      ) : null}
    </>
  );
}
