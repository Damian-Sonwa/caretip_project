import type { ReactNode } from "react";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type MobileDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** Defaults to left slide-in panel. */
  side?: "left" | "top";
  ariaLabel?: string;
};

/**
 * Lightweight mobile drawer — instant open, short close, no backdrop-blur (mobile GPU friendly).
 */
export function MobileDrawer({
  isOpen,
  onClose,
  children,
  className,
  side = "left",
  ariaLabel,
}: MobileDrawerProps) {
  const reduceMotion = useReducedMotion();

  if (!isOpen) return null;

  const panelMotionClass =
    side === "left"
      ? reduceMotion
        ? "translate-x-0"
        : "caretip-mobile-drawer-panel--open"
      : reduceMotion
        ? "translate-y-0 opacity-100"
        : "caretip-mobile-drawer-panel--open-top";

  return (
    <>
      <button
        type="button"
        aria-label="Close menu"
        className={cn(
          "fixed inset-0 z-40 bg-black/50 lg:hidden",
          reduceMotion ? "opacity-100" : "caretip-mobile-drawer-backdrop--open",
        )}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        className={cn(
          "fixed z-50 flex flex-col lg:hidden",
          side === "left"
            ? "inset-y-0 left-0 w-[min(100%,18rem)] max-w-[85vw] border-r border-neutral-200/80 shadow-xl"
            : "left-0 right-0 top-full border-b border-border/50 shadow-lg",
          "bg-gradient-to-b from-white to-stone-50/95 text-sidebar-foreground",
          panelMotionClass,
          className,
        )}
      >
        {children}
      </aside>
    </>
  );
}
