import type { HowItWorksVisualVariant } from "@/components/public/howItWorksFlow";
import { ImageMoment } from "@/components/public/HowItWorksProductMoment";
import hw01 from "../../../images/hw01.png";
import hw02 from "../../../images/hw02.png";
import hw03 from "../../../images/hw03.png";
import hw04 from "../../../images/hw04.png";
import hw05 from "../../../images/hw05.png";
import hw06 from "../../../images/hw06.png";
import hw07 from "../../../images/hw07.png";
import hw08 from "../../../images/hw08.png";
import hw09 from "../../../images/hw09.png";

const HW_IMAGES: Record<HowItWorksVisualVariant, string> = {
  account: hw01,
  team: hw02,
  qrGenerate: hw03,
  qrPlace: hw04,
  customerTip: hw05,
  employeeTip: hw06,
  analytics: hw07,
  payout: hw08,
  growth: hw09,
};

const VISUAL_LABEL_KEYS: Record<HowItWorksVisualVariant, string> = {
  account: "staticPages.howItWorks.visual.account",
  team: "staticPages.howItWorks.visual.team",
  qrGenerate: "staticPages.howItWorks.visual.qrGenerate",
  qrPlace: "staticPages.howItWorks.visual.qrPlace",
  customerTip: "staticPages.howItWorks.visual.customerTip",
  employeeTip: "staticPages.howItWorks.visual.employeeTip",
  analytics: "staticPages.howItWorks.visual.analytics",
  payout: "staticPages.howItWorks.visual.payout",
  growth: "staticPages.howItWorks.visual.growth",
};

type HowItWorksStepVisualProps = {
  variant: HowItWorksVisualVariant;
  className?: string;
};

export function HowItWorksStepVisual({ variant, className }: HowItWorksStepVisualProps) {
  return (
    <ImageMoment
      className={className}
      imageSrc={HW_IMAGES[variant]}
      labelKey={VISUAL_LABEL_KEYS[variant]}
      objectPosition="center"
    />
  );
}
