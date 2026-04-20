import { cn } from "@/lib/utils";
import { LoadingSpinner } from "./ui/loading-spinner";

/** Text-only “CareTip” mark for loading states (no logo image). */
export function CareTipLoadingTitle({
  compact,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "select-none font-sans font-bold leading-none tracking-tight",
        compact
          ? "text-2xl sm:text-3xl"
          : "text-[clamp(2rem,8vw,3.25rem)]",
        className
      )}
      style={{
        textRendering: "geometricPrecision",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <span className="text-primary">Care</span>
      <span className="text-neutral-600 dark:text-neutral-400">Tip</span>
    </h1>
  );
}

export type CareTipPageLoaderProps = {
  message?: string;
  className?: string;
  /**
   * fullscreen — full-viewport branded (dashboards / rare full-page module loads).
   * section — in-page blocks (lists, settings body).
   * compact — tables, overlays, modals (smaller title + md spinner).
   * wait — full-viewport **non-branded** wait (QR resolve, guards, data hydration).
   *          CareTip-branded moments are reserved for app launch (PWA) and global route transitions.
   */
  variant?: "fullscreen" | "section" | "compact" | "wait";
};

export function CareTipPageLoader({
  message,
  className,
  variant = "fullscreen",
}: CareTipPageLoaderProps) {
  const spinnerSize = variant === "compact" ? "md" : "lg";

  const variantClass =
    variant === "fullscreen"
      ? "flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-6"
      : variant === "wait"
        ? "flex min-h-screen flex-col items-center justify-center gap-5 bg-background px-6"
        : variant === "section"
          ? "flex flex-col items-center justify-center gap-6 py-16 px-4"
          : "flex flex-col items-center justify-center gap-4";

  if (variant === "wait") {
    return (
      <div
        className={cn(variantClass, className)}
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        <LoadingSpinner size="lg" />
        {message ? (
          <p className="max-w-sm text-center text-sm text-muted-foreground">{message}</p>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className={cn(variantClass, className)}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <CareTipLoadingTitle compact={variant === "compact"} />
      <div className="flex flex-col items-center gap-3">
        <LoadingSpinner size={spinnerSize} />
        {message ? (
          <p className="max-w-sm text-center text-sm text-muted-foreground">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
