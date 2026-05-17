import { useMemo } from "react";
import { Smartphone } from "lucide-react";
import { useTranslation } from "react-i18next";
import heroVisualEn from "../../../images/aftermath.png";
import heroVisualDe from "../../../images/YCE.png";
import { Navigation } from "../components/Navigation";
import { FeatureShowcase, type TabMedia } from "@/components/ui/feature-showcase";
import { SimpleSetupSection } from "../components/landing/SimpleSetupSection";
import { HospitalityTeamsUnifiedSection } from "../components/landing/HospitalityTeamsUnifiedSection";
import { EmployeeLandingSection } from "../components/landing/EmployeeLandingSection";
import { BusinessLandingSection } from "../components/landing/BusinessLandingSection";
import { LandingFeaturesSection } from "../components/landing/LandingFeaturesSection";
import { PaymentsSection } from "../components/landing/PaymentsSection";
import { LandingRealLifeSection } from "../components/landing/LandingRealLifeSection";
import { LandingSocialProofSection } from "../components/landing/LandingSocialProofSection";
import { LandingFinalCtaSection } from "../components/landing/LandingFinalCtaSection";
import { Footer } from "../components/Footer";

/** Landing has no email/password forms; autofill mitigations live on `AuthPage` (login/signup). */
export function LandingPage() {
  const { t, i18n } = useTranslation();

  const showcaseTabs: TabMedia[] = useMemo(() => {
    const isDe = i18n.language?.toLowerCase().startsWith("de");
    const src = isDe ? heroVisualDe : heroVisualEn;
    return [
      {
        value: "contactless",
        label: t("landing.showcase.tabQrLabel"),
        Icon: Smartphone,
        src,
        alt: t("landing.showcase.tabQrAlt"),
        imageFit: "cover",
        imageObjectPosition: "center",
      },
    ];
  }, [t, i18n.language]);

  const showcaseStats = useMemo(
    () => [t("landing.showcase.statLive"), t("landing.showcase.statPos"), t("landing.showcase.statSecure")],
    [t],
  );

  return (
    <div className="caretip-landing relative min-h-screen w-full min-w-0 font-sans bg-[linear-gradient(180deg,#fafaf8_0%,#ffffff_38%,#f7f6f4_100%)]">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 bottom-0 z-0 min-h-[100dvh] bg-[radial-gradient(ellipse_150%_70%_at_50%_-18%,rgba(235,153,44,0.07),transparent_60%),radial-gradient(ellipse_95%_55%_at_0%_30%,rgba(120,113,105,0.045),transparent_55%),radial-gradient(ellipse_95%_55%_at_100%_34%,rgba(235,153,44,0.04),transparent_55%)]"
      />
      <div className="relative z-10 w-full min-w-0">
        <div className="fixed top-0 left-0 right-0 z-50 w-full max-w-[100vw] overflow-x-clip">
          <Navigation />
        </div>
        <main className="w-full min-w-0 overflow-x-hidden">
          <FeatureShowcase
            id="about-section"
            className=""
            title={t("landing.showcase.title")}
            description={t("landing.showcase.description")}
            stats={showcaseStats}
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
          <PaymentsSection />
          <LandingRealLifeSection />
          <LandingSocialProofSection />
          <LandingFinalCtaSection />
        </main>
        <Footer />
      </div>
    </div>
  );
}