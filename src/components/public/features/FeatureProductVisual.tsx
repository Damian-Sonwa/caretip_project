import qrImg from "../../../../images/QR01.png";
import analyticsImg from "../../../../images/dashboard02.png";
import employeeImg from "../../../../images/employee03.png";
import securityImg from "../../../../images/payment02.png";
import realtimeImg from "../../../../images/live05.png";
import locationsImg from "../../../../images/location01.png";
import type { FeatureVisualVariant } from "@/components/public/features/featuresPageConfig";
import { cn } from "@/lib/utils";

type FeatureProductVisualProps = {
  variant: FeatureVisualVariant;
  featured?: boolean;
  className?: string;
};

const FEATURE_IMAGES: Record<
  FeatureVisualVariant,
  { src: string; objectPosition: string; overlay?: boolean }
> = {
  qr: { src: qrImg, objectPosition: "center" },
  employee: { src: employeeImg, objectPosition: "center 22%", overlay: true },
  analytics: { src: analyticsImg, objectPosition: "center center" },
  security: { src: securityImg, objectPosition: "center" },
  realtime: { src: realtimeImg, objectPosition: "center" },
  locations: { src: locationsImg, objectPosition: "center" },
};

export function FeatureProductVisual({ variant, featured = false, className }: FeatureProductVisualProps) {
  const { src, objectPosition, overlay } = FEATURE_IMAGES[variant];
  const h = featured ? "h-[11.5rem] sm:h-[12.5rem]" : "h-[7.5rem] sm:h-[8.25rem]";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-neutral-200/60 bg-[#f7f5f2] dark:border-neutral-800 dark:bg-neutral-900/80",
        h,
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
      {overlay ? (
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/40 via-transparent to-transparent" />
      ) : null}
    </div>
  );
}
