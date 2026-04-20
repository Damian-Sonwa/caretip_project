import React from "react";
import { Building2, Smartphone, UsersRound } from "lucide-react";
import { Navigation } from "../components/Navigation";
import { FeatureShowcase, type TabMedia } from "@/components/ui/feature-showcase";
import heroTapToTip from "../../../images/caretip-image.png";
import heroTeamMotivation from "../../../images/newly01.png";
import heroBusinessImpact from "../../../images/newly02.png";
import { BenefitsSection } from "../components/landing/BenefitsSection";
import { QRTippingSection } from "../components/landing/QRTippingSection";
import { StaffMotivationSection } from "../components/landing/StaffMotivationSection";
import { DashboardPreviewSection } from "../components/landing/DashboardPreviewSection";
import { FeedbackSection } from "../components/landing/FeedbackSection";
import { SimpleSetupSection } from "../components/landing/SimpleSetupSection";
import { Footer } from "../components/Footer";

const SHOWCASE_TABS: TabMedia[] = [
  {
    value: "contactless",
    label: "Tap to Tip",
    Icon: Smartphone,
    src: heroTapToTip,
    alt: "Phone with CareTip QR code, tap to tip",
    imageFit: "contain",
  },
  {
    value: "team-motivation",
    label: "Team motivation",
    Icon: UsersRound,
    src: heroTeamMotivation,
    alt: "Team and employee motivation",
    imageFit: "contain",
  },
  {
    value: "business-impact",
    label: "Business impact",
    Icon: Building2,
    src: heroBusinessImpact,
    alt: "Business growth with CareTip",
    imageFit: "contain",
  },
];

/** Landing has no email/password forms; autofill mitigations live on `AuthPage` (login/signup). */
export function LandingPage() {
  return (
    <div className="relative min-h-screen bg-white">
      {/* Premium gradient background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-orange-50/5 to-white pointer-events-none" />
      
      <div className="relative z-10">
        <div className="fixed top-0 left-0 right-0 z-50 w-full max-w-[100vw] overflow-x-clip">
          <Navigation />
        </div>
        <main className="overflow-x-hidden">
            <FeatureShowcase
              id="about-section"
              className="font-sans"
              eyebrow="CareTip"
              title="Tip in seconds with a simple QR scan."
              description="Guests pay from their phone. You see payouts and team performance in one place."
              stats={["No setup fees", "Fast payouts", "Secure payments"]}
              steps={[
                {
                  id: "s1",
                  title: "Guests scan your QR",
                  text: "Table tents or badges. No guest app required.",
                },
                {
                  id: "s2",
                  title: "You control routing",
                  text: "Pool by shift or tip individuals. Your rules.",
                },
                {
                  id: "s3",
                  title: "Clear payout visibility",
                  text: "Digital records your team can trust.",
                },
              ]}
              tabs={SHOWCASE_TABS}
              defaultTab="contactless"
              primaryCtaLabel="GET STARTED FREE"
              primaryCtaTo="/onboarding"
              secondaryCtaLabel="How it works"
              secondaryCtaTo="/#how-it-works"
              useAnimatedHero={true}
            />
          <BenefitsSection />
          <div id="features" className="scroll-mt-[80px]">
            <QRTippingSection />
            <StaffMotivationSection />
          </div>
          <DashboardPreviewSection />
          <FeedbackSection />
          <SimpleSetupSection />
        </main>
        <Footer />
      </div>
    </div>
  );
}