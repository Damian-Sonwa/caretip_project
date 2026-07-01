import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Logical mobile viewport (iPhone 15 Pro class devices). */
export const PHONE_MOCKUP_VIEWPORT_WIDTH = 390;
export const PHONE_MOCKUP_VIEWPORT_HEIGHT = 844;

export type PhoneMockupVariant = "iphone-15-pro";
export type PhoneMockupSize = "sm" | "md" | "lg" | "xl";

const SIZE_WIDTH: Record<PhoneMockupSize, number> = {
  sm: 264,
  md: 300,
  lg: 340,
  xl: 400,
};

export type PhoneMockupProps = {
  children: ReactNode;
  variant?: PhoneMockupVariant;
  size?: PhoneMockupSize;
  /** Caps total device height; width scales down to preserve aspect ratio. */
  maxShellHeight?: number;
  className?: string;
  /** Accessible label for the device presentation. */
  label?: string;
};

/** Outer shell aspect ratio (width / height). */
const SHELL_ASPECT = 402 / 874;

function resolveShellWidth(size: PhoneMockupSize, maxShellHeight?: number): number {
  const base = SIZE_WIDTH[size];
  if (!maxShellHeight) return base;
  const widthFromHeight = maxShellHeight * SHELL_ASPECT;
  return Math.min(base, widthFromHeight);
}

export function PhoneMockup({
  children,
  variant = "iphone-15-pro",
  size = "lg",
  maxShellHeight,
  className,
  label = "Mobile device preview",
}: PhoneMockupProps) {
  const screenRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const screen = screenRef.current;
    if (!screen) return;

    const updateScale = () => {
      const width = screen.clientWidth;
      if (width <= 0) return;
      setScale(width / PHONE_MOCKUP_VIEWPORT_WIDTH);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(screen);
    return () => observer.disconnect();
  }, []);

  const shellWidth = resolveShellWidth(size, maxShellHeight);

  return (
    <div
      className={cn("phone-mockup", className)}
      style={{ width: shellWidth, maxWidth: "100%" }}
      role="img"
      aria-label={label}
    >
      <div className="phone-mockup__stage">
        <div className="phone-mockup__ambient" aria-hidden />
        <div className={cn("phone-mockup__shell", `phone-mockup__shell--${variant}`)}>
          <span className="phone-mockup__btn phone-mockup__btn--silent" aria-hidden />
          <span className="phone-mockup__btn phone-mockup__btn--volume-up" aria-hidden />
          <span className="phone-mockup__btn phone-mockup__btn--volume-down" aria-hidden />
          <span className="phone-mockup__btn phone-mockup__btn--power" aria-hidden />

          <div className="phone-mockup__bezel">
            <div ref={screenRef} className="phone-mockup__screen">
              <div
                className="phone-mockup__scaled-shell"
                style={{ height: PHONE_MOCKUP_VIEWPORT_HEIGHT * scale }}
              >
                <div
                  className="phone-mockup__viewport customer-flow"
                  style={{
                    width: PHONE_MOCKUP_VIEWPORT_WIDTH,
                    height: PHONE_MOCKUP_VIEWPORT_HEIGHT,
                    transform: `scale(${scale})`,
                  }}
                >
                  {children}
                </div>
              </div>
            </div>

            <div className="phone-mockup__dynamic-island" aria-hidden>
              <span className="phone-mockup__island-camera" />
            </div>
            <div className="phone-mockup__speaker" aria-hidden />
            <div className="phone-mockup__glare" aria-hidden />
          </div>
        </div>
      </div>
    </div>
  );
}
