import { useEffect, useState, type ComponentProps } from "react";

import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { ProgressiveBlur } from "@/components/ui/progressive-blur";
import { cn } from "@/lib/utils";

function useDocumentDark() {
  const [dark, setDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setDark(root.classList.contains("dark"));
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return dark;
}

export type LogoCloudLogo = {
  src: string;
  alt: string;
  width?: number;
  height?: number;
};

type LogoCloudProps = ComponentProps<"div"> & {
  logos?: LogoCloudLogo[];
  children?: React.ReactNode;
  /** RGB triplet for progressive edge fade (light surfaces). */
  fadeRgb?: string;
  /** RGB triplet when `html.dark` is active. */
  fadeRgbDark?: string;
};

export function LogoCloud({
  logos,
  children,
  fadeRgb = "255, 255, 255",
  fadeRgbDark = "10, 10, 10",
  className,
  ...props
}: LogoCloudProps) {
  const isDark = useDocumentDark();
  const edgeFade = isDark ? fadeRgbDark : fadeRgb;
  const sliderContent =
    children ??
    logos?.map((logo) => (
      <img
        key={`logo-${logo.alt}`}
        alt={logo.alt}
        className="pointer-events-none h-4 select-none md:h-5 dark:brightness-0 dark:invert"
        height="auto"
        loading="lazy"
        src={logo.src}
        width="auto"
      />
    ));

  return (
    <div
      className={cn(
        "caretip-logo-cloud relative mx-auto max-w-3xl bg-gradient-to-r from-secondary via-transparent to-secondary py-6 md:border-x md:border-neutral-200/80 dark:md:border-neutral-800/80",
        className,
      )}
      {...props}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-px left-1/2 w-screen -translate-x-1/2 border-t border-neutral-200/80 dark:border-neutral-800/80"
      />

      <InfiniteSlider gap={42} reverse duration={60} durationOnHover={20}>
        {sliderContent}
      </InfiniteSlider>

      <ProgressiveBlur
        blurIntensity={1}
        className="pointer-events-none absolute top-0 left-0 h-full w-[120px] sm:w-[160px]"
        direction="left"
        fadeRgb={edgeFade}
      />
      <ProgressiveBlur
        blurIntensity={1}
        className="pointer-events-none absolute top-0 right-0 h-full w-[120px] sm:w-[160px]"
        direction="right"
        fadeRgb={edgeFade}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-px left-1/2 w-screen -translate-x-1/2 border-b border-neutral-200/80 dark:border-neutral-800/80"
      />
    </div>
  );
}
