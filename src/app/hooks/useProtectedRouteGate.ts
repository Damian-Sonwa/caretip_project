import { useEffect, useMemo } from "react";
import { useLocation } from "react-router";
import { useAuth } from "./useAuth";
import {
  getLoginPathForAllowedRoles,
  resolveAuthenticatedAppGuard,
  type AuthGuardDecision,
} from "../lib/authSession";
import { getAuthSessionFlags } from "../lib/authSessionBootstrap";
import { isAuthRestorePending } from "../lib/authRestore";
import { hasClientStoredSession } from "../lib/authUserStore";
import { isClientSessionRevoked } from "../lib/api";

export function useProtectedRouteGate(allowedRoles: Array<"business" | "employee">) {
  const { user, authStatus } = useAuth();
  const location = useLocation();

  const gate = useMemo(() => {
    const authBlocking = authStatus === "initializing" || isAuthRestorePending();
    const storedSessionSync =
      !user && !isClientSessionRevoked() && hasClientStoredSession();
    const loginPath = getLoginPathForAllowedRoles(allowedRoles);

    let decision: AuthGuardDecision | null = null;
    if (user) {
      const { onboardingStatusFromServer } = getAuthSessionFlags();
      decision = resolveAuthenticatedAppGuard(user, location.pathname, allowedRoles, {
        onboardingStatusFromServer,
      });
    }

    const guardBlocking = decision?.kind === "wait";
    const blocking = authBlocking || storedSessionSync || guardBlocking;

    return {
      blocking,
      authBlocking,
      storedSessionSync,
      guardBlocking,
      user,
      decision,
      loginPath,
      pathname: location.pathname,
    };
  }, [allowedRoles, authStatus, location.pathname, user]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    if (gate.blocking) {
      console.info("[LoaderDiag] Route resolution blocking", {
        pathname: gate.pathname,
        authBlocking: gate.authBlocking,
        storedSessionSync: gate.storedSessionSync,
        guardBlocking: gate.guardBlocking,
        guardReason: gate.decision?.kind === "wait" ? gate.decision.reason : null,
      });
    } else {
      console.info("[LoaderDiag] Route resolution completed", { pathname: gate.pathname });
    }
  }, [gate]);

  return gate;
}
