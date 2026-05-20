import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  MapPin,
  QrCode,
  Smartphone,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

export type HowItWorksVisualVariant =
  | "account"
  | "team"
  | "qrGenerate"
  | "qrPlace"
  | "customerTip"
  | "employeeTip"
  | "analytics"
  | "payout"
  | "growth";

export type HowItWorksStepExtras = "tip" | "chips3" | "guest" | "employeeStats" | "managerStats" | "payoutStats" | "growthStats" | null;

export type HowItWorksStepDef = {
  step: number;
  icon: LucideIcon;
  visual: HowItWorksVisualVariant;
  reverse: boolean;
  extras: HowItWorksStepExtras;
};

/** Full CareTip journey — setup → floor → employee → manager → payout → growth */
export const HOW_IT_WORKS_STEPS: HowItWorksStepDef[] = [
  { step: 1, icon: UserPlus, visual: "account", reverse: false, extras: "tip" },
  { step: 2, icon: Users, visual: "team", reverse: true, extras: "chips3" },
  { step: 3, icon: QrCode, visual: "qrGenerate", reverse: false, extras: "chips3" },
  { step: 4, icon: MapPin, visual: "qrPlace", reverse: true, extras: null },
  { step: 5, icon: Smartphone, visual: "customerTip", reverse: false, extras: "guest" },
  { step: 6, icon: Wallet, visual: "employeeTip", reverse: true, extras: "employeeStats" },
  { step: 7, icon: BarChart3, visual: "analytics", reverse: false, extras: "managerStats" },
  { step: 8, icon: TrendingUp, visual: "payout", reverse: true, extras: "payoutStats" },
  { step: 9, icon: Sparkles, visual: "growth", reverse: false, extras: "growthStats" },
];
