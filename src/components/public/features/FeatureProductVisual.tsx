import qrImg from "../../../../images/feature001.png";
import analyticsImg from "../../../../images/feature002.jpeg";
import employeeImg from "../../../../images/employee03.webp";
import securityImg from "../../../../images/payment02.webp";
import realtimeImg from "../../../../images/live05.webp";
import locationsImg from "../../../../images/location01.webp";
import type { FeatureVisualVariant } from "@/components/public/features/featuresPageConfig";
import { MarketingPicture } from "@/lib/marketingPicture";
import { cn } from "@/lib/utils";

type FeatureProductVisualProps = {
  variant: FeatureVisualVariant;
  featured?: boolean;
  className?: string;
};

const FEATURE_IMAGES: Record<
  FeatureVisualVariant,
  {
    src: string;
    objectFit: "contain" | "cover";
    objectPosition: string;
    overlay?: boolean;
    featuredHeight: string;
    standardHeight: string;
  }
> = {
  qr: {
    src: qrImg,
    objectFit: "cover",
    objectPosition: "center center",
    featuredHeight: "h-[12.5rem] sm:h-[14rem]",
    standardHeight: "h-[8rem] sm:h-[9rem]",
  },
  employee: {
    src: employeeImg,
    objectFit: "cover",
    objectPosition: "center 22%",
    overlay: true,
    featuredHeight: "h-[11.5rem] sm:h-[12.5rem]",
    standardHeight: "h-[7.5rem] sm:h-[8.25rem]",
  },
  analytics: {
    src: analyticsImg,
    objectFit: "cover",
    objectPosition: "center 42%",
    featuredHeight: "h-[12rem] sm:h-[13.5rem]",
    standardHeight: "h-[8rem] sm:h-[9rem]",
  },
  security: {
    src: securityImg,
    objectFit: "cover",
    objectPosition: "center",
    featuredHeight: "h-[11.5rem] sm:h-[12.5rem]",
    standardHeight: "h-[7.5rem] sm:h-[8.25rem]",
  },
  realtime: {
    src: realtimeImg,
    objectFit: "cover",
    objectPosition: "center",
    featuredHeight: "h-[11.5rem] sm:h-[12.5rem]",
    standardHeight: "h-[7.5rem] sm:h-[8.25rem]",
  },
  locations: {
    src: locationsImg,
    objectFit: "cover",
    objectPosition: "center",
    featuredHeight: "h-[11.5rem] sm:h-[12.5rem]",
    standardHeight: "h-[7.5rem] sm:h-[8.25rem]",
  },
};

export function FeatureProductVisual({ variant, featured = false, className }: FeatureProductVisualProps) {
  const { src, objectFit, objectPosition, overlay, featuredHeight, standardHeight } =
    FEATURE_IMAGES[variant];
  const h = featured ? featuredHeight : standardHeight;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border border-neutral-200/60 bg-[#f7f5f2] dark:border-neutral-800 dark:bg-neutral-900/80",
        h,
        className,
      )}
      aria-hidden
    >
      <MarketingPicture
        src={src}
        alt=""
        className={cn(
          "absolute inset-0 h-full w-full",
          objectFit === "contain" ? "object-contain" : "object-cover",
        )}
        style={{ objectPosition }}
        priority={featured}
        fadeIn={!featured}
      />
      {overlay ? (
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/40 via-transparent to-transparent" />
      ) : null}
    </div>
  );
}
