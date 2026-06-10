import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { caretipBtnPrimaryFull, caretipBtnSecondaryFull } from "@/lib/caretipButtonSystem";
import { cn } from "@/lib/utils";

type AuthStableSubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: "primary" | "secondary";
  loadingAriaLabel?: string;
  children: ReactNode;
};

/** Primary/secondary CTA with centered spinner overlay — label width preserved while loading. */
export function AuthStableSubmitButton({
  loading = false,
  variant = "primary",
  loadingAriaLabel,
  className,
  children,
  disabled,
  ...rest
}: AuthStableSubmitButtonProps) {
  const base = variant === "secondary" ? caretipBtnSecondaryFull : caretipBtnPrimaryFull;

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      aria-label={loading && loadingAriaLabel ? loadingAriaLabel : rest["aria-label"]}
      className={cn(
        base,
        "caretip-auth-submit caretip-auth-submit--stable",
        variant === "secondary" && "caretip-auth-submit--secondary",
        className,
      )}
    >
      <span className="caretip-auth-submit-label">{children}</span>
      {loading ? (
        <Loader2 className="caretip-auth-submit-spinner h-4 w-4 animate-spin" aria-hidden />
      ) : null}
    </button>
  );
}

type AuthErrorSlotProps = {
  children?: ReactNode;
  id?: string;
};

/** Reserved block for form-level validation / API errors (fixed min-height). */
export function AuthErrorSlot({ children, id }: AuthErrorSlotProps) {
  return (
    <div
      id={id}
      className="caretip-auth-error-slot"
      role={children ? "alert" : undefined}
      aria-live="polite"
    >
      {children}
    </div>
  );
}

type AuthFieldErrorSlotProps = {
  children?: ReactNode;
};

/** Reserved line beneath a field for inline hints (e.g. password mismatch). */
export function AuthFieldErrorSlot({ children }: AuthFieldErrorSlotProps) {
  return (
    <p className="caretip-auth-field-error-slot" role={children ? "status" : undefined}>
      {children ?? "\u00a0"}
    </p>
  );
}

type AuthFormStatusSlotProps = {
  children?: ReactNode;
};

/** Reserved line for auxiliary status copy (e.g. “Please wait…”). */
export function AuthFormStatusSlot({ children }: AuthFormStatusSlotProps) {
  return (
    <p className="caretip-auth-form-status-slot" role={children ? "status" : undefined}>
      {children}
    </p>
  );
}
