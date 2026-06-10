import type { ReactNode } from "react";

import { AuthCurvedBlobShell } from "@/components/ui/auth-switch";

import { AuthMarketingPanel } from "./AuthMarketingPanel";



type AuthSplitLayoutProps = {

  children: ReactNode;

  /** Optional banner above the auth card (cross-session notice, etc.). */

  topSlot?: ReactNode;

  /** Drives curved blob animation on sign-in ↔ sign-up toggle. */

  signUpMode?: boolean;

};



/**

 * Premium curved split-screen auth shell — animated blob brand panel + stable card.

 */

export function AuthSplitLayout({ children, topSlot, signUpMode = false }: AuthSplitLayoutProps) {

  return (

    <AuthCurvedBlobShell

      signUpMode={signUpMode}

      className="caretip-auth-split-layout--curved font-sans"

      brandPanel={<AuthMarketingPanel />}

      authPanel={

        <div className="caretip-auth-split-layout__panel-inner">

          {topSlot ? <div className="caretip-auth-split-layout__top-slot">{topSlot}</div> : null}

          {children}

        </div>

      }

    />

  );

}

