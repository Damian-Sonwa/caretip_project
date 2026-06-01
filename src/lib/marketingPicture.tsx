import type { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type MarketingPictureProps = {
  src: string;
  webpSrc?: string;
  alt: string;
  className?: string;
  style?: ImgHTMLAttributes<HTMLImageElement>["style"];
} & Pick<ImgHTMLAttributes<HTMLImageElement>, "loading" | "decoding" | "sizes" | "fetchPriority">;

/** PNG/JPEG fallback with optional WebP source for marketing imagery. */
export function MarketingPicture({
  src,
  webpSrc,
  alt,
  className,
  loading = "lazy",
  decoding = "async",
  sizes,
  fetchPriority,
  style,
}: MarketingPictureProps) {
  const imgProps = {
    alt,
    className: cn(className),
    loading,
    decoding,
    sizes,
    style,
    ...(fetchPriority ? { fetchPriority } : {}),
  } as ImgHTMLAttributes<HTMLImageElement>;

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
