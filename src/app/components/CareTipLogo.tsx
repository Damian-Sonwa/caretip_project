import type { ImgHTMLAttributes } from "react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import companyLogoWebp from "@/assets/brand/company_logo.webp";
import companyLogoAvif from "@/assets/brand/company_logo.avif";
import {
  CARETIP_LOGO_SIZE_CLASS,
  resolveCareTipLogoSizeToken,
  type CareTipLogoSizeToken,
} from "@/lib/caretipLogoSizes";

export type CareTipLogoSize =
  | CareTipLogoSizeToken
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

export {
  DASHBOARD_HEADER_LOGO_CLASS,
  DASHBOARD_DRAWER_LOGO_CLASS,
  CUSTOMER_JOURNEY_HEADER_LOGO_CLASS,
} from "@/lib/caretipLogoSizes";

/** Auth logo surface — circular glass on marketing hero; soft capsule on login cards. */
export const CARE_TIP_LOGO_AUTH_SURFACE_CLASS = "caretip-auth-logo-surface";

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
   * @deprecated Width tokens handle nav sizing; no isolated double-scale slot.
   */
  layoutIsolatedDouble?: boolean;
  /** @deprecated */
  visualScale?: number;
  /** @deprecated */
  scale?: number;
};

const imgBase =
  "block shrink-0 contrast-[1.06] drop-shadow-[0_1px_2px_rgba(0,0,0,0.14)] object-contain h-auto max-w-full";

type LogoPictureProps = {
  alt: string;
  className?: string;
  loading?: ImgHTMLAttributes<HTMLImageElement>["loading"];
  priority?: boolean;
};

function CareTipLogoPicture({
  alt,
  className,
  loading = "lazy",
  priority = false,
}: LogoPictureProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(priority);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setReady(true);
    }
  }, []);

  return (
    <span className={cn("caretip-image-frame block max-w-full", className)}>
      {!ready ? <span className="caretip-image-frame__shimmer" aria-hidden /> : null}
      <picture className="block max-w-full">
        <source type="image/avif" srcSet={companyLogoAvif} />
        <source type="image/webp" srcSet={companyLogoWebp} />
        <img
          ref={imgRef}
          src={companyLogoWebp}
          alt={alt}
          width={640}
          height={240}
          className={cn(
            imgBase,
            "caretip-marketing-img relative z-[2]",
            ready && "caretip-marketing-img--ready",
          )}
          loading={priority ? "eager" : loading}
          decoding="async"
          onLoad={() => setReady(true)}
          {...(priority ? ({ fetchpriority: "high" } as ImgHTMLAttributes<HTMLImageElement>) : {})}
        />
      </picture>
    </span>
  );
}

/**
 * Full wordmark from optimized `company_logo` assets. Width tokens preserve tagline legibility.
 */
export function CareTipLogo({
  className,
  size = "sidebar",
  align = "left",
  alt = "CareTip",
  layoutIsolatedDouble: _layoutIsolatedDouble,
}: CareTipLogoProps) {
  const token = resolveCareTipLogoSizeToken(size);
  const sizeClass = CARETIP_LOGO_SIZE_CLASS[token];
  const priority = token === "nav" || token === "large";

  return (
    <CareTipLogoPicture
      alt={alt}
      priority={priority}
      className={cn(
        align === "center" && "mx-auto",
        alignClass[align],
        sizeClass,
        className,
      )}
    />
  );
}
