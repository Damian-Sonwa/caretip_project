/** Background hold while global loader is active — never renders a spinner. */
export function globalAppLoadingHoldClassName(): string {
  return "min-h-[100dvh] w-full bg-background";
}
