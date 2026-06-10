import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const MOBILE_HERO_MQ = "(max-width: 767px)";

function syncMobileHeroMetrics(container: HTMLElement, brand: HTMLElement) {
  const isMobile = window.matchMedia(MOBILE_HERO_MQ).matches;
  if (!isMobile) {
    container.style.removeProperty("--auth-mobile-hero-h");
    container.style.removeProperty("--auth-mobile-curve-y");
    container.removeAttribute("data-auth-mobile-ready");
    return;
  }

  const height = brand.offsetHeight;
  container.style.setProperty("--auth-mobile-hero-h", `${height}px`);
  container.style.setProperty("--auth-mobile-curve-y", `${height}px`);
  container.setAttribute("data-auth-mobile-ready", "true");
}

export interface AuthCurvedBlobShellProps {
  /** Animates the curved blob toward the sign-up position when true. */
  signUpMode?: boolean;
  brandPanel: ReactNode;
  authPanel: ReactNode;
  className?: string;
}

/**
 * Full-height auth layout with an animated circular curved divider.
 * Visual shell only — pass brand + auth content as children slots.
 * CareTip-branded (slate + orange); adapted from sliding-panel auth pattern.
 */
export function AuthCurvedBlobShell({
  signUpMode = false,
  brandPanel,
  authPanel,
  className,
}: AuthCurvedBlobShellProps) {
  const containerRef = useRef<HTMLElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const brand = brandRef.current;
    if (!container || !brand) return;

    const update = () => syncMobileHeroMetrics(container, brand);

    const ro = new ResizeObserver(update);
    ro.observe(brand);

    const mq = window.matchMedia(MOBILE_HERO_MQ);
    mq.addEventListener("change", update);
    window.addEventListener("orientationchange", update);
    window.visualViewport?.addEventListener("resize", update);

    update();
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", update);
      window.removeEventListener("orientationchange", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, []);

  return (
    <main
      ref={containerRef}
      className={cn(
        "caretip-auth-curved-container",
        signUpMode && "caretip-auth-curved-container--sign-up",
        className,
      )}
    >
      <div className="caretip-auth-curved-blob" aria-hidden />
      <div ref={brandRef} className="caretip-auth-curved-brand">
        {brandPanel}
      </div>
      <section className="caretip-auth-split-layout__panel" aria-label="Authentication">
        {authPanel}
      </section>
    </main>
  );
}

/** Alias for shadcn / ui folder convention */
export type AuthSwitchProps = AuthCurvedBlobShellProps;
export const AuthSwitch = AuthCurvedBlobShell;
