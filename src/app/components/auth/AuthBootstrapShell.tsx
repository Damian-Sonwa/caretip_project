import { GlobalAppLoadingHold } from "@/app/components/GlobalAppLoadingHold";

/**
 * Neutral auth bootstrap shell — no login form, session cards, or split marketing layout.
 * Shown while refresh-token validation / storage hydration resolves, or while navigating
 * away after a successful sign-in so authenticated chrome never flashes on the login route.
 *
 * Global overlay is owned by {@link AuthBootstrapLoadingRegistrar} or
 * {@link useAuthPostLoginTransitionOverlay} — never register a second AUTH loader here.
 */
export function AuthBootstrapShell() {
  return (
    <div className="caretip-auth-page relative min-h-[100dvh] font-sans" role="status" aria-busy="true" aria-live="polite">
      <GlobalAppLoadingHold className="min-h-[100dvh]" />
    </div>
  );
}
