import { cn } from "@/lib/utils";

export type BusinessHeroImagePreviewProps = {
  className?: string;
  src: string;
  /** Caps height in the hero column (matches employee hero visual behavior). */
  maxHeight?: string;
};

/**
 * Business dashboard hero media wrapper that matches the employee hero layout:
 * - no extra background/padding beyond the image itself
 * - tight aspect-ratio sizing (5/3)
 * - optional max-height cap to avoid tall empty bands
 */
export function BusinessHeroImagePreview({
  className,
  src,
  maxHeight,
}: BusinessHeroImagePreviewProps) {
  return (
    <div className={cn("relative isolate w-full max-w-full touch-manipulation", className)}>
      <div
        className="relative mx-auto w-full min-w-0 max-w-none"
        style={{ aspectRatio: "4 / 3", ...(maxHeight ? { maxHeight } : {}) }}
      >
        <img
          src={src}
          alt=""
          className="absolute inset-0 h-full w-full object-contain"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>
    </div>
  );
}

