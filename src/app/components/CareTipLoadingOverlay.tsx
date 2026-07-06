import { cn } from "@/lib/utils";
import { CareTipBrandLoader } from "./CareTipBrandLoader";

export type CareTipLoadingOverlayProps = {
  className?: string;
  exiting?: boolean;
  /** Skip shell fade-in when continuing from the HTML first paint splash. */
  seamless?: boolean;
  /** Skip logo/track entrance animations (handoff between overlays). */
  steady?: boolean;
  message?: string;
  showMessage?: boolean;
  "aria-label"?: string;
};

/**
 * Fixed full-viewport branded loader overlay — page mounts underneath at full opacity.
 */
export function CareTipLoadingOverlay({
  className,
  exiting = false,
  seamless = false,
  steady = false,
  message,
  showMessage = false,
  "aria-label": ariaLabel = "Loading CareTip",
}: CareTipLoadingOverlayProps) {
  return (
    <div
      className={cn(
        "caretip-loading-overlay fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-background px-6 text-foreground",
        seamless && "caretip-loading-overlay--seamless",
        exiting && "caretip-loading-overlay--exiting",
        className,
      )}
      role="status"
      aria-busy={!exiting}
      aria-live="polite"
      aria-label={ariaLabel}
    >
      <CareTipBrandLoader
        message={message}
        showMessage={showMessage}
        steady={steady || seamless}
      />
    </div>
  );
}
