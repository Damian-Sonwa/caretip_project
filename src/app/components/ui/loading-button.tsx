import type { ComponentProps, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

type LoadingButtonProps = ComponentProps<typeof Button> & {
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
};

/** Primary action button with consistent busy state (label preserved, spinner overlay). */
export function LoadingButton({
  loading = false,
  loadingLabel,
  children,
  disabled,
  className,
  ...rest
}: LoadingButtonProps) {
  return (
    <Button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={loading && loadingLabel ? loadingLabel : rest["aria-label"]}
      className={cn(
        "caretip-loading-button relative",
        loading && "caretip-loading-button--busy",
        className,
      )}
    >
      <span className={cn("caretip-loading-button__label", loading && "opacity-0")}>
        {children}
      </span>
      {loading ? (
        <Loader2 className="caretip-loading-button__spinner h-4 w-4 animate-spin" aria-hidden />
      ) : null}
    </Button>
  );
}
