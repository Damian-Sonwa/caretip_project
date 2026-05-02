import type { CareTipPageLoaderProps } from "./CareTipPageLoader";
import { CareTipPageLoader } from "./CareTipPageLoader";

export type PageLoaderProps = Pick<CareTipPageLoaderProps, "message" | "className" | "variant">;

/**
 * Canonical loading UI for route gates and primary page waits.
 * Prefer this (or {@link AppLoader}) over ad-hoc spinners so auth and data hydration stay consistent.
 */
export function PageLoader({
  message = "Setting things up for you...",
  className,
  variant = "wait",
}: PageLoaderProps) {
  return <CareTipPageLoader variant={variant} message={message} className={className} />;
}
