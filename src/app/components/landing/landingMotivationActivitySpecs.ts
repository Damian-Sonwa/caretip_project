import { BarChart3, Coins, Star, Target, type LucideIcon } from "lucide-react";

export type ActivityCardId = "tip" | "review" | "dashboard" | "goal";

export type ActivityCardSpec = {
  id: ActivityCardId;
  Icon: LucideIcon;
  badgeKey: string;
  titleKey: string;
  metaKey: string;
  accentClass: string;
  mobilePrimary: "badge" | "title";
  mobileSecondary: "title" | "meta";
};

export const MOTIVATION_ACTIVITY_CARD_SPECS: ActivityCardSpec[] = [
  {
    id: "tip",
    Icon: Coins,
    badgeKey: "landing.motivation.cards.tip.badge",
    titleKey: "landing.motivation.cards.tip.title",
    metaKey: "landing.motivation.cards.tip.meta",
    accentClass: "caretip-motivation-activity__icon--tip",
    mobilePrimary: "title",
    mobileSecondary: "meta",
  },
  {
    id: "review",
    Icon: Star,
    badgeKey: "landing.motivation.cards.review.badge",
    titleKey: "landing.motivation.cards.review.title",
    metaKey: "landing.motivation.cards.review.meta",
    accentClass: "caretip-motivation-activity__icon--review",
    mobilePrimary: "badge",
    mobileSecondary: "title",
  },
  {
    id: "dashboard",
    Icon: BarChart3,
    badgeKey: "landing.motivation.cards.dashboard.badge",
    titleKey: "landing.motivation.cards.dashboard.title",
    metaKey: "landing.motivation.cards.dashboard.meta",
    accentClass: "caretip-motivation-activity__icon--dashboard",
    mobilePrimary: "badge",
    mobileSecondary: "title",
  },
  {
    id: "goal",
    Icon: Target,
    badgeKey: "landing.motivation.cards.goal.badge",
    titleKey: "landing.motivation.cards.goal.title",
    metaKey: "landing.motivation.cards.goal.meta",
    accentClass: "caretip-motivation-activity__icon--goal",
    mobilePrimary: "badge",
    mobileSecondary: "title",
  },
];
