import type { ReactNode } from "react";

import { AuthCurvedBlobShell } from "@/components/ui/auth-switch";

import { AuthMarketingPanel } from "./AuthMarketingPanel";



type AuthSplitLayoutProps = {
  children: ReactNode;
  topSlot?: ReactNode;
  signUpMode?: boolean;
  authLane?: "business" | "employee";
  /** Smaller brand panel for verification / recovery flows. */
  compactMarketing?: boolean;
};

export function AuthSplitLayout({
  children,
  topSlot,
  signUpMode = false,
  authLane = "business",
  compactMarketing = false,
}: AuthSplitLayoutProps) {
  return (
    <AuthCurvedBlobShell
      signUpMode={signUpMode}
      className="caretip-auth-split-layout--curved font-sans"
      brandPanel={<AuthMarketingPanel lane={authLane} signUpMode={signUpMode} compact={compactMarketing} />}

      authPanel={

        <div className="caretip-auth-split-layout__panel-inner">

          {topSlot ? <div className="caretip-auth-split-layout__top-slot">{topSlot}</div> : null}

          {children}

        </div>

      }

    />

  );

}

