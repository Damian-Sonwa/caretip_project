import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { Link } from "react-router";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  addDismissedFixId,
  readDismissedFixIds,
  removeDismissedFixId,
  type FixPromptDismissPersistence,
} from "../lib/fixPromptStorage";

/** Known dashboard fix prompts — extend as new prompts are added. */
export const FIX_PROMPT_IDS = [
  "missingQR",
  "pendingVerification",
  "profilePhoto",
  "platformDataLoad",
] as const;

export type FixPromptId = (typeof FIX_PROMPT_IDS)[number];

export type FixPromptTone = "default" | "info";

export type FixPromptProps = {
  id: FixPromptId;
  /** When false, the prompt is hidden and this id is removed from dismissed storage. */
  issueActive: boolean;
  title: string;
  description?: string;
  /** Primary CTA; omit for dismiss-only informational prompts. */
  actionLabel?: string;
  /** Navigate on primary action (preferred for in-app routes). */
  actionTo?: string;
  /** Run on primary action when not using `actionTo`. */
  onAction?: () => void;
  secondaryLabel?: string;
  secondaryTo?: string;
  onSecondaryClick?: () => void;
  dismissPersistence?: FixPromptDismissPersistence;
  tone?: FixPromptTone;
  className?: string;
};

function useFixPromptVisibility(
  id: FixPromptId,
  issueActive: boolean,
  dismissPersistence: FixPromptDismissPersistence,
) {
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    if (!issueActive) {
      removeDismissedFixId(id);
    }
  }, [issueActive, id]);

  const dismissed = useMemo(() => readDismissedFixIds(dismissPersistence).includes(id), [dismissPersistence, id, epoch]);

  const dismiss = useCallback(() => {
    addDismissedFixId(id, dismissPersistence);
    setEpoch((e) => e + 1);
  }, [id, dismissPersistence]);

  const visible = issueActive && !dismissed;
  return { visible, dismiss };
}

export function FixPrompt({
  id,
  issueActive,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  secondaryLabel,
  secondaryTo,
  onSecondaryClick,
  dismissPersistence = "local",
  tone = "default",
  className,
}: FixPromptProps) {
  const panelId = useId();
  const { visible, dismiss } = useFixPromptVisibility(id, issueActive, dismissPersistence);

  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dismiss();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, dismiss]);

  if (!visible) return null;

  const hasSecondary = Boolean(secondaryLabel && (secondaryTo || onSecondaryClick));
  const hasPrimary = Boolean(actionLabel && (actionTo || onAction));
  const hasActions = hasSecondary || hasPrimary;

  const shell =
    tone === "info"
      ? "border-2 border-primary/30 bg-muted/40"
      : "border-2 border-primary bg-muted/50 shadow-sm";

  return (
    <div
      className={cn("relative rounded-xl p-4 pt-3 pr-14 text-sm text-foreground sm:pr-16", shell, className)}
      role="region"
      aria-labelledby={panelId}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className={cn(
          "absolute right-2 top-2 inline-flex min-h-[32px] min-w-[32px] items-center justify-center rounded-md",
          "text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        )}
      >
        <X className="h-4 w-4 shrink-0" aria-hidden />
      </button>

      <div
        className={cn(
          "flex flex-col gap-3 sm:gap-4",
          hasActions && "sm:flex-row sm:items-center sm:justify-between",
        )}
      >
        <div className="min-w-0 flex-1">
          <p id={panelId} className="font-semibold text-foreground">
            {title}
          </p>
          {description ? <p className="mt-1 text-muted-foreground">{description}</p> : null}
        </div>
        {hasActions ? (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            {hasSecondary ? (
              secondaryTo ? (
                <Button variant="ghost" size="sm" className="h-9 justify-start px-2 sm:justify-center" asChild>
                  <Link to={secondaryTo!}>{secondaryLabel}</Link>
                </Button>
              ) : (
                <Button variant="ghost" size="sm" type="button" className="h-9" onClick={onSecondaryClick}>
                  {secondaryLabel}
                </Button>
              )
            ) : null}
            {hasPrimary ? (
              actionTo ? (
                <Button className="h-9 shrink-0 bg-primary hover:bg-primary/90" asChild>
                  <Link to={actionTo}>{actionLabel}</Link>
                </Button>
              ) : (
                <Button type="button" className="h-9 shrink-0 bg-primary hover:bg-primary/90" onClick={onAction}>
                  {actionLabel}
                </Button>
              )
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
