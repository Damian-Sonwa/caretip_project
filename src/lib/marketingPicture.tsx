import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type MarketingPictureProps = {
  src: string;
  webpSrc?: string;
  avifSrc?: string;
  alt: string;
  className?: string;
  frameClassName?: string;
  style?: ImgHTMLAttributes<HTMLImageElement>["style"];
  /** Maps to DOM `fetchpriority` (lowercase) for React 18 compatibility. */
  fetchPriority?: "high" | "low" | "auto";
  /** Above-the-fold: eager load + high fetch priority. */
  priority?: boolean;
  /** Smooth opacity fade once decoded (default true for lazy images). */
  fadeIn?: boolean;
  width?: number;
  height?: number;
} & Pick<ImgHTMLAttributes<HTMLImageElement>, "loading" | "decoding" | "sizes">;

/** PNG/JPEG fallback with optional WebP source for marketing imagery. */
export function MarketingPicture({
  src,
  webpSrc,
  avifSrc,
  alt,
  className,
  frameClassName,
  loading,
  decoding = "async",
  sizes,
  fetchPriority,
  priority = false,
  fadeIn,
  width,
  height,
  style,
}: MarketingPictureProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [ready, setReady] = useState(false);
  const shouldFade = fadeIn ?? !priority;
  const resolvedLoading = loading ?? (priority ? "eager" : "lazy");
  const resolvedFetchPriority = fetchPriority ?? (priority ? "high" : undefined);

  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth > 0) {
      setReady(true);
    }
  }, [src]);

  const imgProps = {
    ref: imgRef,
    alt,
    className: cn(
      "h-full w-full",
      className,
      shouldFade && "caretip-marketing-img",
      shouldFade && ready && "caretip-marketing-img--ready",
    ),
    loading: resolvedLoading,
    decoding,
    sizes,
    width,
    height,
    style,
    onLoad: () => setReady(true),
    ...(resolvedFetchPriority
      ? ({ fetchpriority: resolvedFetchPriority } as ImgHTMLAttributes<HTMLImageElement>)
      : {}),
  };

  const resolvedSrc = webpSrc ?? src;

  const imageNode = !webpSrc && !avifSrc ? (
    <img src={src} {...imgProps} />
  ) : (
    <picture>
      {avifSrc ? <source type="image/avif" srcSet={avifSrc} /> : null}
      {webpSrc ? <source type="image/webp" srcSet={webpSrc} /> : null}
      <img src={resolvedSrc} {...imgProps} />
    </picture>
  );

  if (!shouldFade) {
    return imageNode;
  }

  return (
    <span
      className={cn("caretip-image-frame", frameClassName)}
      style={
        width && height
          ? { aspectRatio: `${width} / ${height}` }
          : undefined
      }
    >
      {!ready ? <span className="caretip-image-frame__shimmer" aria-hidden /> : null}
      {imageNode}
    </span>
  );
}
