import { motion } from "motion/react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FinalCtaBackdrop } from "@/app/components/landing/FinalCtaBackdrop";
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

      <motion.div
        data-polish-view
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8% 0px" }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="caretip-final-cta-stage relative z-[1] mx-auto w-full max-w-3xl text-center"
      >
        <p className="caretip-final-cta-eyebrow font-sans text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/90 sm:text-xs">
          {t("landing.finalCta.eyebrow")}
        </p>

        <h2 className="caretip-final-cta-headline mt-4 font-sans text-balance text-neutral-50 sm:mt-5">
          {t("landing.finalCta.title")}
        </h2>

        {landingCopyVisible(sectionSubtitle) ? (
          <p className="caretip-final-cta-subtitle mx-auto mt-4 max-w-md text-pretty font-sans sm:mt-5">
            {sectionSubtitle}
          </p>
        ) : null}

        <div className="caretip-final-cta-actions mt-8 sm:mt-9">
          <div className="caretip-final-cta-action relative inline-flex justify-center">
            <div aria-hidden className="caretip-final-cta-button-glow pointer-events-none" />
            <Link
              to="/auth?mode=signup&role=business&from=landing"
              className={cn(
                landingUi.heroCtaPrimary,
                "caretip-final-cta-button relative z-[1] gap-2 px-8 lg:min-w-[13.5rem]",
              )}
            >
              {t("landing.finalCta.cta")}
              <ArrowRight className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2.25} aria-hidden />
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
