import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "../../lib/mediaUrl";

const sizeClass = {
  sm: "h-9 w-9 min-h-9 min-w-9 text-[10px]",
  /** ~40px — dashboard shell / header row */
  header: "h-10 w-10 min-h-10 min-w-10 text-[11px]",
  md: "h-11 w-11 min-h-11 min-w-11 text-xs",
  lg: "h-16 w-16 min-h-16 min-w-16 text-sm",
  xl: "h-24 w-24 min-h-24 min-w-24 text-base",
} as const;

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "B";
  if (parts.length === 1) return (parts[0]![0] ?? "B").toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase() || "B";
}

export type BusinessLogoMarkSize = keyof typeof sizeClass;

export function BusinessLogoMark({
  logoPathOrUrl,
  businessName,
  size = "md",
  className,
  rounded = "rounded-lg",
  fallbackTone = "brand",
}: {
  logoPathOrUrl?: string | null;
  businessName: string;
  size?: BusinessLogoMarkSize;
  className?: string;
  rounded?: string;
  /** Muted stone fallback — e.g. compact header avatars. */
  fallbackTone?: "brand" | "muted";
}) {
  const src = resolveMediaUrl(logoPathOrUrl ?? undefined);
  const label = businessName.trim() || "Business";
  const [imgFailed, setImgFailed] = useState(false);
  const isCircle = rounded.includes("full");

  useEffect(() => {
    setImgFailed(false);
  }, [src]);

  const shellClass = cn(
    "shrink-0 overflow-hidden border shadow-sm",
    isCircle ? "border-border/70 bg-muted/75" : "border-border bg-white",
    sizeClass[size],
    rounded,
    className,
  );

  if (src && !imgFailed) {
    return (
      <div className={cn(shellClass, "flex items-center justify-center")}>
        <img
          src={src}
          alt=""
          className={cn(
            "block max-h-full max-w-full",
            isCircle ? "h-full w-full object-contain p-1.5" : "h-full w-full object-contain p-0.5",
          )}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center border font-semibold tracking-tight",
        fallbackTone === "muted"
          ? "border-border/70 bg-muted text-muted-foreground"
          : "border-border bg-primary/10 font-bold text-primary",
        sizeClass[size],
        rounded,
        className,
      )}
      aria-hidden
    >
      <span>{initialsFromName(label)}</span>
    </div>
  );
}

/** Compact mark when name is unknown — building glyph. */
export function BusinessLogoPlaceholder({
  size = "md",
  className,
}: {
  size?: BusinessLogoMarkSize;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-muted text-muted-foreground",
        sizeClass[size],
        className,
      )}
      aria-hidden
    >
      <Building2 className="h-1/2 w-1/2" />
    </div>
  );
}
