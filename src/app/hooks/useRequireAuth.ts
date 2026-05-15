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
    if (!authHydrated || !sessionValidated) return;
    if (user === null) {
      navigate(getLoginPathFromAppPath(location.pathname), { replace: true });
    }
  }, [user, navigate, authHydrated, sessionValidated, location.pathname]);

  return {
    user,
    authHydrated,
    sessionValidated,
    isAuthLoading,
    isBusiness,
    isEmployee,
    logout,
    updateUser,
    exitImpersonation,
  };
}
