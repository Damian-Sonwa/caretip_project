import feature001Webp from "../../../../images/feature001.webp";
import feature001Avif from "../../../../images/feature001.avif";
import feature002Webp from "../../../../images/feature002.webp";
import feature002Avif from "../../../../images/feature002.avif";
import employeeWebp from "../../../../images/employee03.webp";
import employeeAvif from "../../../../images/employee03.avif";
import paymentWebp from "../../../../images/payment02.webp";
import paymentAvif from "../../../../images/payment02.avif";
import liveWebp from "../../../../images/live05.webp";
import liveAvif from "../../../../images/live05.avif";
import locationWebp from "../../../../images/location01.webp";
import locationAvif from "../../../../images/location01.avif";
import type { FeatureVisualVariant } from "@/components/public/features/featuresPageConfig";
import { MarketingPicture } from "@/lib/marketingPicture";
import { cn } from "@/lib/utils";

type FeatureProductVisualProps = {
  variant: FeatureVisualVariant;
  featured?: boolean;
  className?: string;
};

type FeatureImageConfig = {
  src: string;
  webp?: string;
  avif?: string;
  width: number;
  height: number;
  sizes: string;
  objectFit: "contain" | "cover";
  objectPosition: string;
  overlay?: boolean;
  featuredHeight: string;
  standardHeight: string;
};

const FEATURE_CARD_IMAGE = {
  width: 1024,
  height: 1024,
} as const;

const FEATURED_CARD_SIZES = "(max-width: 1024px) 100vw, 50vw";
const STANDARD_CARD_SIZES = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw";

const FEATURE_IMAGES: Record<FeatureVisualVariant, FeatureImageConfig> = {
  qr: {
    src: feature001Webp,
    webp: feature001Webp,
    avif: feature001Avif,
    width: FEATURE_CARD_IMAGE.width,
    height: FEATURE_CARD_IMAGE.height,
    sizes: FEATURED_CARD_SIZES,
    objectFit: "cover",
    objectPosition: "center center",
    featuredHeight: "h-[12.5rem] sm:h-[14rem]",
    standardHeight: "h-[8rem] sm:h-[9rem]",
  },
  employee: {
    src: employeeWebp,
    webp: employeeWebp,
    avif: employeeAvif,
    width: FEATURE_CARD_IMAGE.width,
    height: FEATURE_CARD_IMAGE.height,
    sizes: STANDARD_CARD_SIZES,
    objectFit: "cover",
    objectPosition: "center 22%",
    overlay: true,
    featuredHeight: "h-[11.5rem] sm:h-[12.5rem]",
    standardHeight: "h-[7.5rem] sm:h-[8.25rem]",
  },
  analytics: {
    src: feature002Webp,
    webp: feature002Webp,
    avif: feature002Avif,
    width: FEATURE_CARD_IMAGE.width,
    height: FEATURE_CARD_IMAGE.height,
    sizes: FEATURED_CARD_SIZES,
    objectFit: "cover",
    objectPosition: "center 42%",
    featuredHeight: "h-[12rem] sm:h-[13.5rem]",
    standardHeight: "h-[8rem] sm:h-[9rem]",
  },
  security: {
    src: paymentWebp,
    webp: paymentWebp,
    avif: paymentAvif,
    width: FEATURE_CARD_IMAGE.width,
    height: FEATURE_CARD_IMAGE.height,
    sizes: STANDARD_CARD_SIZES,
    objectFit: "cover",
    objectPosition: "center",
    featuredHeight: "h-[11.5rem] sm:h-[12.5rem]",
    standardHeight: "h-[7.5rem] sm:h-[8.25rem]",
  },
  realtime: {
    src: liveWebp,
    webp: liveWebp,
    avif: liveAvif,
    width: FEATURE_CARD_IMAGE.width,
    height: FEATURE_CARD_IMAGE.height,
    sizes: STANDARD_CARD_SIZES,
    objectFit: "cover",
    objectPosition: "center",
    featuredHeight: "h-[11.5rem] sm:h-[12.5rem]",
    standardHeight: "h-[7.5rem] sm:h-[8.25rem]",
  },
  locations: {
    src: locationWebp,
    webp: locationWebp,
    avif: locationAvif,
    width: FEATURE_CARD_IMAGE.width,
    height: FEATURE_CARD_IMAGE.height,
    sizes: STANDARD_CARD_SIZES,
    objectFit: "cover",
    objectPosition: "center",
    featuredHeight: "h-[11.5rem] sm:h-[12.5rem]",
    standardHeight: "h-[7.5rem] sm:h-[8.25rem]",
  },
};

export function FeatureProductVisual({ variant, featured = false, className }: FeatureProductVisualProps) {
  const {
    src,
    webp,
    avif,
    width,
    height,
    sizes,
    objectFit,
    objectPosition,
    overlay,
    featuredHeight,
    standardHeight,
  } = FEATURE_IMAGES[variant];
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
        webpSrc={webp ?? src}
        avifSrc={avif}
        alt=""
        width={width}
        height={height}
        sizes={sizes}
        frameClassName="absolute inset-0 h-full w-full"
        className={cn(
          "absolute inset-0 h-full w-full",
          objectFit === "contain" ? "object-contain" : "object-cover",
        )}
        style={{ objectPosition }}
        loading={featured ? "eager" : "lazy"}
        priority={featured}
        fadeIn={!featured}
      />
      {overlay ? (
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/40 via-transparent to-transparent" />
      ) : null}
    </div>
  );
}
