import { cn } from "@/lib/utils";
import { caretipBtnPrimary, caretipBtnSecondary } from "@/lib/caretipButtonSystem";

export const pricingPageUi = {
  sectionGap: "mt-16 sm:mt-20 lg:mt-24",
  controlsWrap: "caretip-pricing-controls-wrap",
  cardsStage: "caretip-pricing-cards-stage",
  ctaPanel: "caretip-pricing-final-cta",
  ctaTitle: "caretip-pricing-final-cta__title",
  ctaBody: "caretip-pricing-final-cta__body",
  ctaButtonPrimary: cn(caretipBtnPrimary, "inline-flex w-full justify-center no-underline sm:w-auto sm:min-w-[10rem]"),
  ctaButtonSecondary: cn(
    caretipBtnSecondary,
    "inline-flex w-full justify-center no-underline sm:w-auto sm:min-w-[10rem]",
  ),
  cardCtaPrimary: cn(
    caretipBtnPrimary,
    "caretip-pricing-card-cta w-full justify-center no-underline",
  ),
  cardCtaSecondary: cn(
    caretipBtnSecondary,
    "caretip-pricing-card-cta w-full justify-center no-underline",
  ),
  cardCtaEnterprise: cn(
    caretipBtnPrimary,
    "caretip-pricing-card-cta caretip-pricing-card-cta--enterprise w-full justify-center no-underline",
  ),
} as const;
