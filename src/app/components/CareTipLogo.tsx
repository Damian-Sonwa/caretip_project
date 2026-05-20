import { cn } from "@/lib/utils";
import companyLogo from "@/assets/brand/company_logo.png";

export type CareTipLogoSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "hero"
  | "header"
  | "auth";

export type CareTipLogoAlign = "left" | "center";

/**
 * Solid white surface for logo rows (nav, auth cards, sidebars, QR strips).
 * Use with border-b so the mark sits on a clean, consistent ground.
 */
export const CARE_TIP_LOGO_SURFACE_CLASS =
  "bg-white border-b border-border/80";

const sizeClass: Record<CareTipLogoSize, string> = {
  /** Compact — mobile dashboard bar, tight UI (mobile-first height bumped for small screens) */
  xs: "h-16 max-h-16 min-h-[4rem] w-auto max-w-[min(400px,78vw)] sm:h-[4.25rem] sm:max-h-[4.25rem] sm:min-h-[4.25rem] md:h-[4.5rem] md:max-h-[4.5rem] md:min-h-[4.5rem]",
  sm: "h-[3.75rem] max-h-[3.75rem] min-h-[3.75rem] w-auto max-w-[min(400px,100%)] md:h-14 md:max-h-14 md:min-h-[3.5rem] lg:h-[3.75rem] lg:max-h-[3.75rem] lg:min-h-[3.75rem]",
  md: "h-[4rem] max-h-[4rem] min-h-[4rem] w-auto max-w-[min(420px,92vw)] sm:h-[4.25rem] sm:max-h-[4.25rem] sm:min-h-[4.25rem] lg:h-16 lg:max-h-16 lg:min-h-[4rem]",
  lg: "h-[4.25rem] max-h-[4.25rem] min-h-[4.25rem] w-auto max-w-[min(480px,92vw)] md:h-16 md:max-h-16 md:min-h-[4rem] xl:h-[4.5rem] xl:max-h-[4.5rem] xl:min-h-[4.5rem]",
  hero: "h-[5rem] max-h-[5rem] min-h-[5rem] w-auto max-w-[min(500px,92vw)] sm:h-20 sm:max-h-20 sm:min-h-[5rem]",
  /** Main marketing nav — bold, high-visibility (SaaS-style wordmark) */
  header:
    "w-auto max-w-[min(640px,96vw)] min-h-[4.5rem] h-[4.5rem] max-h-[4.5rem] sm:min-h-[4.25rem] sm:h-[4.5rem] sm:max-h-[4.5rem] md:h-[4.75rem] md:max-h-[4.75rem] lg:h-[5rem] lg:max-h-[5rem] xl:h-[5.25rem] xl:max-h-[5.25rem]",
  /** Login / signup — clearly visible, smaller than header */
  auth:
    "w-auto max-w-[min(360px,90vw)] h-14 max-h-14 min-h-[3.5rem] sm:h-16 sm:max-h-16 sm:min-h-[4rem]",
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
   * centering) so headers and auth cards don’t grow vertically.
   */
  layoutIsolatedDouble?: boolean;
  /** Multiplier for isolated visual size (default `2` ≈ double). Ignored unless `layoutIsolatedDouble`. */
  visualScale?: number;
  /** Alias for `visualScale` when using `layoutIsolatedDouble`. */
  scale?: number;
};

const imgBase =
  "block shrink-0 contrast-[1.06] drop-shadow-[0_1px_2px_rgba(0,0,0,0.14)] object-contain";

/**
 * Full wordmark from `company_logo.png`. Uses `object-contain` and max-width
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
    /* Block + w-full: abspos img does not give the slot intrinsic width. Parent flex items with
       `flex-none` need a non-zero min-width or this span collapses to 0px on desktop. */
    return (
      <span
        className={cn(
          "relative block h-[5rem] min-h-[5rem] w-full min-w-[11rem] max-w-full overflow-hidden sm:h-[4.5rem] sm:min-h-[4.5rem] md:h-[4.75rem] md:min-h-[4.75rem] xl:h-[5.25rem] xl:min-h-[5.25rem]",
          className
        )}
      >
        <img
          src={companyLogo}
          alt={alt}
          width={640}
          height={240}
          className={cn(
            imgBase,
            "pointer-events-none absolute top-1/2 left-0 max-h-none w-auto max-w-full -translate-y-1/2 object-left object-contain"
          )}
          style={{
            height: `${m * 3.5}rem`,
            maxWidth: "100%",
          }}
          loading="lazy"
          decoding="async"
        />
      </span>
    );
  }

  if (layoutIsolatedDouble && size === "auth") {
    return (
      <span
        className={cn(
          "relative flex h-10 w-full max-w-[220px] items-center justify-center overflow-hidden",
          className
        )}
      >
        <img
          src={companyLogo}
          alt={alt}
          width={640}
          height={240}
          className={cn(
            imgBase,
            "pointer-events-none absolute top-1/2 left-1/2 max-h-none w-auto max-w-[min(220px,82vw)] -translate-x-1/2 -translate-y-1/2 object-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.08)]"
          )}
          style={{
            height: `${m * 2.75}rem`,
            maxWidth: "min(220px, 82vw)",
          }}
          loading="lazy"
          decoding="async"
        />
      </span>
    );
  }

  return (
    <img
      src={companyLogo}
      alt={alt}
      width={640}
      height={240}
      className={cn(
        imgBase,
        align === "center" && "mx-auto",
        alignClass[align],
        sizeClass[size],
        className
      )}
      loading="lazy"
      decoding="async"
    />
  );
}
