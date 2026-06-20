import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { FinalCtaBackdrop } from "@/app/components/landing/FinalCtaBackdrop";
import { LandingTrustComplianceStrip } from "@/app/components/landing/LandingTrustComplianceStrip";
import { LandingReveal } from "@/components/landing/LandingReveal";
import { LandingCopySentences } from "@/components/landing/LandingCopySentences";
import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { cn } from "@/lib/utils";

export function LandingFinalCtaSection() {
  const { t } = useTranslation();
  const sectionSubtitle = t("landing.finalCta.subtitle");

  return (
    <section
      id="final-cta"
      className={cn(
        "caretip-landing-final-cta relative scroll-mt-[80px] overflow-hidden",
        "px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-[4.5rem]",
      )}
    >
      <FinalCtaBackdrop />

      <LandingReveal
        data-polish-view
        className="caretip-final-cta-stage relative z-[1] mx-auto w-full min-w-0 max-w-3xl px-0.5 text-center max-lg:max-w-full"
      >
        <p className="caretip-final-cta-eyebrow font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/90 sm:text-xs">
          {t("landing.finalCta.eyebrow")}
        </p>

        <h2 className="caretip-final-cta-headline mt-4 font-sans text-balance text-neutral-50 sm:mt-5">
          {t("landing.finalCta.title")}
        </h2>

        {landingCopyVisible(sectionSubtitle) ? (
          <LandingCopySentences
            text={sectionSubtitle}
            layout="paragraphs"
            className="caretip-final-cta-subtitle mx-auto mt-4 max-w-md text-pretty font-sans sm:mt-5"
            sentenceClassName="caretip-final-cta-subtitle mx-auto max-w-md text-pretty font-sans m-0"
          />
        ) : null}

        <div className="caretip-final-cta-actions mt-6 w-full min-w-0 sm:mt-7">
          <div className={cn(landingUi.sectionCtaUnit, "caretip-final-cta-action relative")}>
            <div aria-hidden className="caretip-final-cta-button-glow pointer-events-none" />
            <Link
              to="/signup"
              className={cn(
                landingUi.sectionCtaPrimary,
                "caretip-final-cta-button relative z-[1] gap-2",
              )}
            >
              {t("landing.finalCta.cta")}
            </Link>
          </div>
        </div>

        <LandingTrustComplianceStrip />
      </LandingReveal>
    </section>
  );
}
