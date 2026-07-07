import brandedQrWebp from "../../../../images/brandedqr.webp";
import brandedQrAvif from "../../../../images/brandedqr.avif";
import employeeMomentWebp from "../../../../images/employee02.webp";
import employeeMomentAvif from "../../../../images/employee02.avif";
import forPaymentWebp from "../../../../images/forpayment.webp";
import forPaymentAvif from "../../../../images/forpayment.avif";
import analyticsMomentWebp from "../../../../images/analytics01.webp";
import analyticsMomentAvif from "../../../../images/analytics01.avif";
import type { FeatureMomentKey } from "@/components/public/features/featuresPageConfig";
import { MarketingPicture } from "@/lib/marketingPicture";
import { cn } from "@/lib/utils";

type FeatureMomentVisualProps = {
  moment: FeatureMomentKey;
  className?: string;
};

const MOMENT_IMAGES: Record<
  FeatureMomentKey,
  { src: string; webp: string; avif: string; objectPosition: string }
> = {
  qr: { src: brandedQrWebp, webp: brandedQrWebp, avif: brandedQrAvif, objectPosition: "center" },
  employee: {
    src: employeeMomentWebp,
    webp: employeeMomentWebp,
    avif: employeeMomentAvif,
    objectPosition: "center 30%",
  },
  payouts: {
    src: forPaymentWebp,
    webp: forPaymentWebp,
    avif: forPaymentAvif,
    objectPosition: "center",
  },
  analytics: {
    src: analyticsMomentWebp,
    webp: analyticsMomentWebp,
    avif: analyticsMomentAvif,
    objectPosition: "center",
  },
};

export function FeatureMomentVisual({ moment, className }: FeatureMomentVisualProps) {
  const { src, webp, avif, objectPosition } = MOMENT_IMAGES[moment];

  return (
    <div
      className={cn(
        "relative h-[7.5rem] overflow-hidden bg-[#f7f5f2] sm:h-[8.25rem] dark:bg-neutral-900/80",
        className,
      )}
      aria-hidden
    >
      <MarketingPicture
        src={src}
        webpSrc={webp}
        avifSrc={avif}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition }}
        loading="lazy"
      />
    </div>
  );
}
