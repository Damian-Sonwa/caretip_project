import brandedQrImg from "../../../../images/brandedqr.jpeg";
import employeeMomentImg from "../../../../images/employee02.jpeg";
import forPaymentImg from "../../../../images/forpayment.jpg";
import analyticsMomentImg from "../../../../images/analytics01.jpeg";
import type { FeatureMomentKey } from "@/components/public/features/featuresPageConfig";
import { cn } from "@/lib/utils";

type FeatureMomentVisualProps = {
  moment: FeatureMomentKey;
  className?: string;
};

const MOMENT_IMAGES: Record<FeatureMomentKey, { src: string; objectPosition: string }> = {
  qr: { src: brandedQrImg, objectPosition: "center" },
  employee: { src: employeeMomentImg, objectPosition: "center 30%" },
  payouts: { src: forPaymentImg, objectPosition: "center" },
  analytics: { src: analyticsMomentImg, objectPosition: "center" },
};

export function FeatureMomentVisual({ moment, className }: FeatureMomentVisualProps) {
  const { src, objectPosition } = MOMENT_IMAGES[moment];

  return (
    <div
      className={cn(
        "relative h-[7.5rem] overflow-hidden bg-[#f7f5f2] sm:h-[8.25rem] dark:bg-neutral-900/80",
        className,
      )}
      aria-hidden
    >
      <img
        src={src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition }}
        loading="lazy"
      />
    </div>
  );
}
