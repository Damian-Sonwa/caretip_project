import { motion } from "motion/react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { cn } from "@/lib/utils";

export function LandingMotivationSection() {
  const { t } = useTranslation();
  const subtitle = t("landing.motivation.subtitle");

  return (
    <section
      id="recognition"
      className={cn(
        landingUi.section,
        landingUi.sectionWhite,
        "caretip-landing-motivation relative scroll-mt-[80px] overflow-hidden",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_0%,rgba(233,120,28,0.08),transparent_65%)]"
      />
      <motion.div
        className="relative mx-auto max-w-3xl px-4 text-center sm:px-6"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-8% 0px" }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <h2 className={cn(landingUi.sectionTitle, "text-balance")}>{t("landing.motivation.title")}</h2>
        {landingCopyVisible(subtitle) ? (
          <p className={cn(landingUi.sectionSubtitle, "mx-auto mt-4 max-w-2xl text-pretty")}>{subtitle}</p>
        ) : null}
        <div className="mt-8 flex justify-center">
          <Link
            to="/auth?mode=signup&role=business&from=landing"
            className={cn(landingUi.heroCtaPrimary, "inline-flex gap-2 px-8")}
          >
            {t("landing.showcase.primaryCta")}
            <ArrowRight className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
