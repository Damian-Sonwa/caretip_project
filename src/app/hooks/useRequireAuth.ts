import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { getLoginPathFromAppPath } from "../lib/authSession";
import { useAuth } from "./useAuth";

/**
 * Ensures protected pages only redirect after auth hydration.
 * While `isAuthLoading` is true, do not navigate away or show duplicate full-page auth spinners
 * (route guards already render {@link AppLoader}).
 */
export function useRequireAuth() {
  const {
    user,
    authHydrated,
    sessionValidated,
    authStatus,
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
    if (authStatus === "initializing") return;
    if (authStatus === "unauthenticated") {
      navigate(getLoginPathFromAppPath(location.pathname), { replace: true });
    }
  }, [authStatus, navigate, location.pathname]);

  return {
    user,
    authHydrated,
    sessionValidated,
    authStatus,
    isAuthLoading,
    isBusiness,
    isEmployee,
    logout,
    updateUser,
    exitImpersonation,
  };
}
