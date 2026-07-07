import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { onboardingBackBtn, onboardingContinueBtn } from "./businessOnboardingUi";

type BusinessOnboardingNavFooterProps = {
  primaryLabel: ReactNode;
  onPrimary: () => void;
  onBack?: () => void;
  showBack?: boolean;
  busy?: boolean;
  disabled?: boolean;
  primaryClassName?: string;
  showArrow?: boolean;
  backLabel: string;
};

/** Fixed card footer: Back left / primary right on desktop; stacked on mobile. */
export function BusinessOnboardingNavFooter({
  primaryLabel,
  onPrimary,
  onBack,
  showBack = false,
  busy = false,
  disabled = false,
  primaryClassName,
  showArrow = true,
  backLabel,
}: BusinessOnboardingNavFooterProps) {
  return (
    <div className="business-onboarding-nav-footer border-t border-zinc-200/70 pt-6 dark:border-zinc-800/70">
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {showBack && onBack ? (
          <button
            type="button"
            onClick={onBack}
            disabled={busy}
            className={cn(onboardingBackBtn, "w-full justify-center sm:w-auto sm:justify-start")}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            {backLabel}
          </button>
        ) : (
          <span className="hidden sm:block" aria-hidden />
        )}

        <button
          type="button"
          onClick={onPrimary}
          disabled={disabled || busy}
          aria-busy={busy}
          className={cn(
            onboardingContinueBtn,
            "w-full sm:w-auto sm:min-w-[9.5rem] sm:shrink-0",
            primaryClassName,
          )}
        >
          {primaryLabel}
          {showArrow && !busy ? <ArrowRight className="h-4 w-4 shrink-0" aria-hidden /> : null}
        </button>
      </div>
    </div>
  );
}
