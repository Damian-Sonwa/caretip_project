import { cn } from "@/lib/utils";

export type BusinessHeroImagePreviewProps = {
  className?: string;
  src: string;
  /** Caps height in the hero column (matches employee hero visual behavior). */
  maxHeight?: string;
};

/**
 * Business dashboard hero: full image visible (letterboxed), no hard crop from a fixed aspect box.
 */
export function BusinessHeroImagePreview({
  className,
  src,
  maxHeight = "min(55vh, 480px)",
}: BusinessHeroImagePreviewProps) {
  return (
    <div className={cn("relative isolate w-full max-w-full touch-manipulation", className)}>
      <div className="relative mx-auto flex w-full min-w-0 max-w-none items-center justify-center">
        <img
          src={src}
          alt=""
          className="block h-auto w-full max-w-full object-contain object-center"
          style={{ maxHeight }}
          loading="eager"
          decoding="async"
          // React 18 warns on `fetchPriority`; keep the DOM attribute via lowercase.
          {...({ fetchpriority: "high" } as unknown as React.ImgHTMLAttributes<HTMLImageElement>)}
        />
      </div>
    </div>
  );
}

