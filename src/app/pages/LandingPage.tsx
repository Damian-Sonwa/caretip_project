import { useState } from "react";
import { useTranslation } from "react-i18next";
import { LandingOnboardingAssistantHost } from "../components/landing/LandingOnboardingAssistantHost";
import heroVisualDe from "../../../images/cca.webp";
import heroVisualEn from "../../../images/en-hero.webp";
import { Navigation } from "../components/Navigation";
import { CareTipLandingHero } from "@/components/landing/CareTipLandingHero";
import { SimpleSetupSection } from "../components/landing/SimpleSetupSection";
import { HospitalityTeamsUnifiedSection } from "../components/landing/HospitalityTeamsUnifiedSection";
import { EmployeeLandingSection } from "../components/landing/EmployeeLandingSection";
import { BusinessLandingSection } from "../components/landing/BusinessLandingSection";
import { LandingFeaturesSection } from "../components/landing/LandingFeaturesSection";
import { PaymentsSection } from "../components/landing/PaymentsSection";
import { LandingRealLifeSection } from "../components/landing/LandingRealLifeSection";
import { LandingSocialProofSection } from "../components/landing/LandingSocialProofSection";
import { LandingMotivationSection } from "../components/landing/LandingMotivationSection";
import { LandingFinalCtaSection } from "../components/landing/LandingFinalCtaSection";
import { Footer } from "../components/Footer";

/** Reversible: set true to restore #social-proof (PDF adjustment — hide testimonials & trust stats). */
const SHOW_LANDING_SOCIAL_PROOF = false;

/** Landing has no email/password forms; autofill mitigations live on `AuthPage` (login/signup). */
export function LandingPage() {
  const { t, i18n } = useTranslation();
  const [landingRoot, setLandingRoot] = useState<HTMLDivElement | null>(null);
  const isDe = i18n.language?.toLowerCase().startsWith("de");
  const heroVisual = isDe ? heroVisualDe : heroVisualEn;

  return (
    <div
      ref={setLandingRoot}
      className="caretip-landing caretip-landing--premium relative min-h-screen w-full min-w-0 font-sans dark:bg-neutral-950"
    >
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 bottom-0 z-0 min-h-[100dvh]"
      />
      <div className="relative z-10 w-full min-w-0">
        <div className="fixed top-0 left-0 right-0 z-50 w-full max-w-[100vw] overflow-x-clip">
          <Navigation />
        </div>
        <main className="caretip-landing-main w-full min-w-0 overflow-x-hidden">
          <CareTipLandingHero
            id="about-section"
            imageSrc={heroVisual}
            imageAlt={t("landing.showcase.tabQrAlt")}
            isDe={isDe}
          />
          <HospitalityTeamsUnifiedSection />
          <SimpleSetupSection />
          <EmployeeLandingSection />
          <BusinessLandingSection />
          <LandingFeaturesSection />
          <PaymentsSection />
          <LandingRealLifeSection />
          <LandingMotivationSection />
          {SHOW_LANDING_SOCIAL_PROOF ? <LandingSocialProofSection /> : null}
          <LandingFinalCtaSection />
        </main>
        <Footer className="caretip-landing-footer" />
      </div>
      <LandingOnboardingAssistantHost rootEl={landingRoot} />
    </div>
  );
}