import { Store, Building2, Crown } from "lucide-react";
import type { TippingTier } from "../components/PricingSection";

export const PRICING_TIERS: TippingTier[] = [
  {
    name: "Starter",
    feeLine: "2.9% + $0.30",
    feeNote: "per successful tip (Stripe)",
    icon: Store,
    description: "Best for small venues getting started with QR tipping.",
    features: [
      "Up to 10 team members",
      "QR codes & staff tip links",
      "Basic tip analytics",
      "Email support",
      "No monthly platform fee",
    ],
    buttonText: "Start free",
    isPopular: false,
  },
  {
    name: "Business",
    feeLine: "2.5% + $0.30",
    feeNote: "per successful tip (Stripe)",
    icon: Building2,
    description: "For growing teams that need more control and branding.",
    features: [
      "Unlimited team members",
      "Branded QR & exports",
      "Priority support",
      "Multi-location friendly",
      "$29/mo platform fee (optional add-on)",
    ],
    buttonText: "Get started",
    isPopular: true,
  },
  {
    name: "Enterprise",
    feeLine: "Custom",
    feeNote: "volume-based tip processing",
    icon: Crown,
    description: "For hospitality groups with custom payout and reporting needs.",
    features: [
      "Everything in Business",
      "Dedicated onboarding",
      "API & integrations",
      "Custom fee structure",
      "Account manager",
    ],
    buttonText: "Contact sales",
    isPopular: false,
  },
];
