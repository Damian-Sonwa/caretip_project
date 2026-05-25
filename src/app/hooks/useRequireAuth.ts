import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { getLoginPathFromAppPath } from "../lib/authSession";
import { isAuthRestorePending } from "../lib/authRestore";
import { hasClientStoredSession } from "../lib/authUserStore";
import { isClientSessionRevoked } from "../lib/api";
import { useAuth } from "./useAuth";

/**
 * Ensures protected pages only redirect after auth hydration.
 * While session restore is in flight, do not navigate away (route guards render {@link AppLoader}).
 */
export function useRequireAuth() {
  const {
    user,
    authHydrated,
    sessionValidated,
    authStatus,
    authReady,
    isAuthLoading,
    isBusiness,
    isEmployee,
    logout,
    updateUser,
    exitImpersonation,
  } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authStatus === "initializing" || isAuthRestorePending()) return;
    if (!sessionValidated) return;
    if (!user && !isClientSessionRevoked() && hasClientStoredSession()) return;
    if (authStatus === "unauthenticated") {
      navigate(getLoginPathFromAppPath(location.pathname), { replace: true });
    }
  }, [authStatus, sessionValidated, navigate, location.pathname, user]);

  return {
    user,
    authHydrated,
    sessionValidated,
    authStatus,
    authReady,
    isAuthLoading,
    isBusiness,
    isEmployee,
    logout,
    updateUser,
    exitImpersonation,
  };
}
