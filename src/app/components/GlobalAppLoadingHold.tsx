import { cn } from "@/lib/utils";
import { globalAppLoadingHoldClassName } from "../lib/globalAppLoading";

/** Placeholder under the global overlay — no spinner, no skeleton. */
export function GlobalAppLoadingHold({ className }: { className?: string }) {
  return <div className={cn(globalAppLoadingHoldClassName(), className)} aria-hidden />;
}
