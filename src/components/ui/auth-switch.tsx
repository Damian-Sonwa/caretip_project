import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface AuthCurvedBlobShellProps {
  /** Animates the curved blob toward the sign-up position when true. */
  signUpMode?: boolean;
  brandPanel: ReactNode;
  authPanel: ReactNode;
  className?: string;
}

/**
 * Auth layout with curved-blob sign-in ↔ sign-up animation (desktop); mobile static orange-black stack.
 */
export function AuthCurvedBlobShell({
  signUpMode = false,
  brandPanel,
  authPanel,
  className,
}: AuthCurvedBlobShellProps) {
  return (
    <main
      className={cn(
        "caretip-auth-curved-container",
        signUpMode && "caretip-auth-curved-container--sign-up",
        className,
      )}
    >
      <div className="caretip-auth-curved-blob" aria-hidden />
      <div className="caretip-auth-curved-brand">
        {brandPanel}
      </div>
      <div className="caretip-auth-mobile-divider" aria-hidden />
      <section className="caretip-auth-split-layout__panel" aria-label="Authentication">
        {authPanel}
      </section>
    </main>
  );
}

/** Alias for shadcn / ui folder convention */
export type AuthSwitchProps = AuthCurvedBlobShellProps;
export const AuthSwitch = AuthCurvedBlobShell;
