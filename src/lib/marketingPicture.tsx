import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type MarketingPictureProps = {
  src: string;
  webpSrc?: string;
  alt: string;
  className?: string;
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
  alt,
  className,
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

  if (!webpSrc) {
    return <img src={src} {...imgProps} />;
  }

  return (
    <picture>
      <source type="image/webp" srcSet={webpSrc} />
      <img src={src} {...imgProps} />
    </picture>
  );
}
