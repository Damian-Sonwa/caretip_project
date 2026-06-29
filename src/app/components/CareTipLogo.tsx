import type { CSSProperties, ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import companyLogoPng from "@/assets/brand/company_logo.png";
import companyLogoWebp from "@/assets/brand/company_logo.webp";
import companyLogoAvif from "@/assets/brand/company_logo.avif";

export type CareTipLogoSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "hero"
  | "header"
  | "auth"
  | "bar"
  | "drawer"
  | "customerHeader"
  | "customerFooter";

export type CareTipLogoAlign = "left" | "center";

/**
 * Solid white surface for logo rows (nav, auth cards, sidebars, QR strips).
 * Use with border-b so the mark sits on a clean, consistent ground.
 */
export const CARE_TIP_LOGO_SURFACE_CLASS =
  "bg-background border-b border-border/80";

/**
 * Dashboard sidebar branding strip — semantic surface (light + dark).
 */
export const DASHBOARD_SIDEBAR_BRAND_CLASS =
  "flex shrink-0 items-center border-b border-sidebar-border bg-sidebar px-4 py-2 lg:px-5 lg:py-2";

/** Shared nav region — sits close to branding without extra top gap. */
export const DASHBOARD_SIDEBAR_NAV_CLASS =
  "flex-1 min-h-0 overflow-y-auto px-3 pt-1.5 pb-4";

/** Mobile drawer header row: logo + close control. */
export const DASHBOARD_SIDEBAR_MOBILE_BRAND_CLASS = cn(
  DASHBOARD_SIDEBAR_BRAND_CLASS,
  "justify-between gap-2 min-h-[3.25rem]",
);

/** Compact wordmark for mobile dashboard top bar — must not exceed viewport at 320px. */
const dashboardHeaderLogoClass =
  "h-9 max-h-9 min-h-9 w-auto max-w-[min(6.75rem,36vw)] sm:h-10 sm:max-h-10 sm:min-h-10 sm:max-w-[min(7.5rem,40vw)]";

/** Mobile drawer wordmark — shorter than desktop sidebar `sm`. */
const dashboardDrawerLogoClass =
  "h-10 max-h-10 min-h-10 w-auto max-w-[min(7.5rem,calc(100%-3rem))]";

/** Compact wordmark for customer tipping journey headers — brand reassurance, not focal. */
const customerJourneyHeaderLogoClass =
  "h-8 max-h-8 min-h-8 w-auto max-w-[4.5rem] sm:h-9 sm:max-h-9 sm:min-h-9 sm:max-w-[5rem]";

/** Tertiary platform mark in customer journey footers. */
const customerJourneyFooterLogoClass =
  "h-5 max-h-5 min-h-5 w-auto max-w-[3.25rem] opacity-75 sm:max-w-[3.5rem]";

export const DASHBOARD_HEADER_LOGO_CLASS = dashboardHeaderLogoClass;
export const CUSTOMER_JOURNEY_HEADER_LOGO_CLASS = customerJourneyHeaderLogoClass;
export const DASHBOARD_DRAWER_LOGO_CLASS = dashboardDrawerLogoClass;

/** Auth logo surface — circular glass on marketing hero; soft capsule on login cards. */
export const CARE_TIP_LOGO_AUTH_SURFACE_CLASS = "caretip-auth-logo-surface";

const sizeClass: Record<CareTipLogoSize, string> = {
  /** Compact — legacy; prefer `bar` in dashboard headers */
  xs: "h-16 max-h-16 min-h-[4rem] w-auto max-w-[min(400px,78vw)] sm:h-[4.25rem] sm:max-h-[4.25rem] sm:min-h-[4.25rem] md:h-[4.5rem] md:max-h-[4.5rem] md:min-h-[4.5rem]",
  sm: "h-[3.75rem] max-h-[3.75rem] min-h-[3.75rem] w-auto max-w-[min(400px,100%)] md:h-14 md:max-h-14 md:min-h-[3.5rem] lg:h-[3.75rem] lg:max-h-[3.75rem] lg:min-h-[3.75rem]",
  md: "h-[4rem] max-h-[4rem] min-h-[4rem] w-auto max-w-[min(420px,92vw)] sm:h-[4.25rem] sm:max-h-[4.25rem] sm:min-h-[4.25rem] lg:h-16 lg:max-h-16 lg:min-h-[4rem]",
  lg: "h-[4.25rem] max-h-[4.25rem] min-h-[4.25rem] w-auto max-w-[min(480px,92vw)] md:h-16 md:max-h-16 md:min-h-[4rem] xl:h-[4.5rem] xl:max-h-[4.5rem] xl:min-h-[4.5rem]",
  hero: "h-[5rem] max-h-[5rem] min-h-[5rem] w-auto max-w-[min(500px,92vw)] sm:h-20 sm:max-h-20 sm:min-h-[5rem]",
  header:
    "w-auto max-w-[min(640px,96vw)] min-h-[4.5rem] h-[4.5rem] max-h-[4.5rem] sm:min-h-[4.25rem] sm:h-[4.5rem] sm:max-h-[4.5rem] md:h-[4.75rem] md:max-h-[4.75rem] lg:h-[5rem] lg:max-h-[5rem] xl:h-[5.25rem] xl:max-h-[5.25rem]",
  auth:
    "w-auto max-w-[min(360px,90vw)] h-14 max-h-14 min-h-[3.5rem] sm:h-16 sm:max-h-16 sm:min-h-[4rem]",
  bar: dashboardHeaderLogoClass,
  drawer: dashboardDrawerLogoClass,
  customerHeader: customerJourneyHeaderLogoClass,
  customerFooter: customerJourneyFooterLogoClass,
};

const alignClass: Record<CareTipLogoAlign, string> = {
  left: "object-left object-contain",
  center: "object-center object-contain",
};

export type CareTipLogoProps = {
  className?: string;
  size?: CareTipLogoSize;
  /** Horizontal alignment for `object-position` (default: left for nav). */
  align?: CareTipLogoAlign;
  alt?: string;
  /**
   * Renders the mark at ~2× visual height inside a fixed layout slot (absolute
   * centering) so headers and auth cards don't grow vertically.
   */
  layoutIsolatedDouble?: boolean;
  /** Multiplier for isolated visual size (default `2` ≈ double). Ignored unless `layoutIsolatedDouble`. */
  visualScale?: number;
  /** Alias for `visualScale` when using `layoutIsolatedDouble`. */
  scale?: number;
};

const imgBase =
  "block shrink-0 contrast-[1.06] drop-shadow-[0_1px_2px_rgba(0,0,0,0.14)] object-contain";

type LogoPictureProps = {
  alt: string;
  className?: string;
  style?: CSSProperties;
  loading?: ImgHTMLAttributes<HTMLImageElement>["loading"];
};

function CareTipLogoPicture({
  alt,
  className,
  style,
  loading = "lazy",
  priority = false,
}: LogoPictureProps & { priority?: boolean }) {
  return (
    <picture className={cn("block max-w-full", className)}>
      <source type="image/avif" srcSet={companyLogoAvif} />
      <source type="image/webp" srcSet={companyLogoWebp} />
      <img
        src={companyLogoPng}
        alt={alt}
        width={640}
        height={240}
        className={cn(imgBase, "h-full w-auto max-w-full")}
        style={style}
        loading={priority ? "eager" : loading}
        decoding="async"
        {...(priority ? ({ fetchpriority: "high" } as ImgHTMLAttributes<HTMLImageElement>) : {})}
      />
    </picture>
  );
}

/**
 * Full wordmark from optimized `company_logo` assets. Uses `object-contain` and max-width
 * caps so the asset is never stretched.
 */
export function CareTipLogo({
  className,
  size = "sm",
  align = "left",
  alt = "CareTip",
  layoutIsolatedDouble = false,
  visualScale = 2,
  scale,
}: CareTipLogoProps) {
  const m = scale ?? visualScale ?? 2;

  if (layoutIsolatedDouble && size === "header") {
    return (
      <span
        className={cn(
          "relative block h-[5rem] min-h-[5rem] w-full min-w-[11rem] max-w-full overflow-hidden sm:h-[4.5rem] sm:min-h-[4.5rem] md:h-[4.75rem] md:min-h-[4.75rem] xl:h-[5.25rem] xl:min-h-[5.25rem]",
          className,
        )}
      >
        <CareTipLogoPicture
          alt={alt}
          priority
          className={cn(
            "pointer-events-none absolute top-1/2 left-0 max-h-none w-auto max-w-full -translate-y-1/2",
          )}
          style={{
            height: `${m * 3.5}rem`,
            maxWidth: "100%",
          }}
        />
      </span>
    );
  }

  if (layoutIsolatedDouble && size === "auth") {
    const leftAligned = align === "left";
    const slotHeightRem = 3.5;
    return (
      <span
        className={cn(
          "relative block w-full min-h-[3.5rem] overflow-visible sm:min-h-[4rem]",
          leftAligned
            ? "max-w-[min(22rem,94vw)]"
            : "mx-auto max-w-[min(17.5rem,88vw)]",
          className,
        )}
      >
        <CareTipLogoPicture
          alt={alt}
          className={cn(
            "pointer-events-none absolute top-1/2 max-h-none w-auto -translate-y-1/2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.12)]",
            leftAligned
              ? "left-0 max-w-[min(22rem,94vw)]"
              : "left-1/2 max-w-[min(17.5rem,88vw)] -translate-x-1/2",
          )}
          style={{
            height: `${m * slotHeightRem}rem`,
          }}
        />
      </span>
    );
  }

  return (
    <CareTipLogoPicture
      alt={alt}
      priority={size === "header" || size === "hero"}
      className={cn(
        align === "center" && "mx-auto",
        alignClass[align],
        sizeClass[size],
        className,
      )}
    />
  );
}
