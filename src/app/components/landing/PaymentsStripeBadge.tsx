import { cn } from "@/lib/utils";

type PaymentsStripeBadgeProps = {
  label: string;
  className?: string;
};

/** Subtle processor attribution — text only, no Stripe logo lockup. */
export function PaymentsStripeBadge({ label, className }: PaymentsStripeBadgeProps) {
  const parts = label.split(/(Stripe)/i);
  const hasStripeWord = parts.length > 1;

  return (
    <div
      className={cn(
        "caretip-stripe-trust-badge inline-flex items-center gap-2.5 rounded-full border border-border/70 bg-background/80 px-4 py-2 shadow-sm backdrop-blur-sm dark:border-neutral-700/80 dark:bg-neutral-900/70",
        className,
      )}
    >
      <span className="caretip-stripe-trust-badge__dot h-2 w-2 shrink-0 rounded-full bg-[#635bff]/80" aria-hidden />
      <span className="text-sm font-medium tracking-wide text-muted-foreground">
        {hasStripeWord ? (
          <>
            {parts.map((part, index) =>
              /^stripe$/i.test(part) ? (
                <span key={index} className="font-semibold text-[#635bff] dark:text-[#7a73ff]">
                  Stripe
                </span>
              ) : (
                <span key={index}>{part}</span>
              ),
            )}
          </>
        ) : (
          label
        )}
      </span>
    </div>
  );
}
