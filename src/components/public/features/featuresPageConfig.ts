import { BarChart3, Building2, QrCode, ShieldCheck, Users, Zap, type LucideIcon } from "lucide-react";

export type FeatureVisualVariant =
  | "qr"
  | "employee"
  | "analytics"
  | "security"
  | "realtime"
  | "locations";

export type FeaturePageItem = {
  id: "1" | "2" | "3" | "4" | "5" | "6";
  Icon: LucideIcon;
  featured: boolean;
  visual: FeatureVisualVariant;
  tagKey: `f${"1" | "2" | "3" | "4" | "5" | "6"}Tag`;
};

export const FEATURES_PAGE_ITEMS: FeaturePageItem[] = [
  { id: "1", Icon: QrCode, featured: true, visual: "qr", tagKey: "f1Tag" },
  { id: "2", Icon: Users, featured: false, visual: "employee", tagKey: "f2Tag" },
  { id: "3", Icon: BarChart3, featured: true, visual: "analytics", tagKey: "f3Tag" },
  { id: "4", Icon: ShieldCheck, featured: false, visual: "security", tagKey: "f4Tag" },
  { id: "5", Icon: Zap, featured: false, visual: "realtime", tagKey: "f5Tag" },
  { id: "6", Icon: Building2, featured: false, visual: "locations", tagKey: "f6Tag" },
];

export const FEATURE_MOMENT_KEYS = ["qr", "employee", "payouts", "analytics"] as const;
export type FeatureMomentKey = (typeof FEATURE_MOMENT_KEYS)[number];
