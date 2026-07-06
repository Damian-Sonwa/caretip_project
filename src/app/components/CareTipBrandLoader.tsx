import { cn } from "@/lib/utils";

export type CareTipBrandLoaderProps = {
  className?: string;
  /** Optional status line (auth bootstrap, sign-out, etc.). */
  message?: string;
  /** Hide message slot entirely. */
  showMessage?: boolean;
  /** Skip one-shot entrance animations (overlay handoff / exit phase). */
  steady?: boolean;
};

/**
 * Branded CareTip loader — logo wordmark + orange glow track (no generic spinner).
 */
export function CareTipBrandLoader({
  className,
  message,
  showMessage = true,
  steady = false,
}: CareTipBrandLoaderProps) {
  return (
    <div className={cn("caretip-brand-loader", steady && "caretip-brand-loader--steady", className)}>
      <div className="caretip-brand-loader__logo-wrap">
        <h1 className="caretip-brand-loader__wordmark" aria-hidden>
          <span className="caretip-brand-loader__wordmark-care">Care</span>
          <span className="caretip-brand-loader__wordmark-tip">Tip</span>
        </h1>
      </div>

      <div className="caretip-brand-loader__indicator" aria-hidden>
        <div className="caretip-brand-loader__indicator-glow" />
      </div>

      {showMessage && message ? (
        <p className="caretip-brand-loader__message">{message}</p>
      ) : null}
    </div>
  );
}
