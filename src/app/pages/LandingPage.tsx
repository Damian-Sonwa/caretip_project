import { useMemo } from "react";
import { Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import heroVisualEn from "../../../images/aftermath.png";
import heroVisualDe from "../../../images/new-hero.png";
import { Navigation } from "../components/Navigation";
import { FeatureShowcase, type TabMedia } from "@/components/ui/feature-showcase";
import { SimpleSetupSection } from "../components/landing/SimpleSetupSection";
import { HospitalityTeamsUnifiedSection } from "../components/landing/HospitalityTeamsUnifiedSection";
import { EmployeeLandingSection } from "../components/landing/EmployeeLandingSection";
import { BusinessLandingSection } from "../components/landing/BusinessLandingSection";
import { LandingFeaturesSection } from "../components/landing/LandingFeaturesSection";
import { LandingRealLifeSection } from "../components/landing/LandingRealLifeSection";
import { LandingFinalCtaSection } from "../components/landing/LandingFinalCtaSection";
import { Footer } from "../components/Footer";

/** Landing has no email/password forms; autofill mitigations live on `AuthPage` (login/signup). */
export function LandingPage() {
  const { t, i18n } = useTranslation();

  const showcaseTabs: TabMedia[] = useMemo(() => {
    const src = i18n.language?.toLowerCase().startsWith("de") ? heroVisualDe : heroVisualEn;
    return [
      {
        value: "contactless",
        label: t("landing.showcase.tabQrLabel"),
        Icon: Smartphone,
        src,
        alt: t("landing.showcase.tabQrAlt"),
        imageFit: "contain",
        imageObjectPosition: "center",
      },
    ];
  }, [t, i18n.language]);

  const showcaseSteps = useMemo(
    () => [
      { id: "s1", title: t("landing.showcase.step1Title"), text: t("landing.showcase.step1Text") },
      { id: "s2", title: t("landing.showcase.step2Title"), text: t("landing.showcase.step2Text") },
      { id: "s3", title: t("landing.showcase.step3Title"), text: t("landing.showcase.step3Text") },
    ],
    [t],
  );

  const showcaseStats = useMemo(
    () => [t("landing.showcase.statLive"), t("landing.showcase.statPos"), t("landing.showcase.statSecure")],
    [t],
  );

  return (
    <div className="relative min-h-screen bg-white">
      <div className="relative z-10">
        <div className="fixed top-0 left-0 right-0 z-50 w-full max-w-[100vw] overflow-x-clip">
          <Navigation />
        </div>
        <main className="overflow-x-hidden">
          <FeatureShowcase
            id="about-section"
            className="font-sans"
            title={t("landing.showcase.title")}
            description={t("landing.showcase.description")}
            stats={showcaseStats}
            steps={showcaseSteps}
            tabs={showcaseTabs}
            defaultTab="contactless"
            primaryCtaLabel={t("landing.showcase.primaryCta")}
            primaryCtaTo="/auth?mode=signup&role=business&from=landing"
            secondaryCtaLabel={t("landing.showcase.secondaryCta")}
            secondaryCtaTo="/join"
            variant="cinematic"
            useAnimatedHero={false}
            heroBorderBeam={false}
          />
          <HospitalityTeamsUnifiedSection />
          <SimpleSetupSection />
          <EmployeeLandingSection />
          <BusinessLandingSection />
          <LandingFeaturesSection />
          <LandingRealLifeSection />
          <LandingFinalCtaSection />
        </main>
        <Footer />
      </div>
    </div>
  );
}
