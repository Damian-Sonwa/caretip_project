import React from "react";
import { Navigation } from "../components/Navigation";
import { PricingSection } from "../components/PricingSection";
import { Footer } from "../components/Footer";
import { AuthLikePageBackground } from "../components/AuthLikePageBackground";
import { PRICING_TIERS } from "../data/pricingTiers";

export function PricingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white">
      <AuthLikePageBackground />
      <div className="relative z-10">
        <Navigation />
        <main id="fees" className="scroll-mt-20">
          <section className="px-6 pb-16 pt-24 sm:pb-24 sm:pt-28">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12 sm:mb-16 space-y-3 sm:space-y-4">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground">
                  Simple tipping economics
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                  Guests pay once per tip. CareTip never creates Stripe subscriptions or recurring
                  invoices: only payment intents for each tip.
                </p>
              </div>
              <PricingSection tiers={PRICING_TIERS} />
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
}
