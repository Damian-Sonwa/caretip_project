import React from "react";
import { Smartphone } from "lucide-react";
import heroCaretipImage from "../../../images/new-hero.png";
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

const SHOWCASE_TABS: TabMedia[] = [
  {
    value: "contactless",
    label: "QR scan",
    Icon: Smartphone,
    src: heroCaretipImage,
    alt: "CareTip guest tipping screen: scan QR, choose amount, and send a tip",
    imageFit: "contain",
    imageObjectPosition: "center",
  },
];

/** Landing has no email/password forms; autofill mitigations live on `AuthPage` (login/signup). */
export function LandingPage() {
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
            eyebrow="CareTip"
            title="Tip in seconds. Reward great service instantly."
            description="CareTip makes it effortless for customers to tip and for teams to track performance, all with a simple QR scan."
            stats={["Live in minutes", "No POS integration", "Secure checkout"]}
            steps={[
              {
                id: "s1",
                title: "Guests scan your QR",
                text: "Table tents, badges, or a shareable link, with no guest app required.",
              },
              {
                id: "s2",
                title: "Tips route your way",
                text: "Pool by shift or reward individuals. You stay in control.",
              },
              {
                id: "s3",
                title: "Everyone sees clarity",
                text: "Staff see earnings; you see performance, without the busywork.",
              },
            ]}
            tabs={SHOWCASE_TABS}
            defaultTab="contactless"
            primaryCtaLabel="Get Started"
            primaryCtaTo="/auth?mode=signup&role=business&from=landing"
            secondaryCtaLabel="Join your team"
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
