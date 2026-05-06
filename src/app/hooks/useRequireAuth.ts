import { useEffect } from "react";
import { useNavigate } from "react-router";
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

  useEffect(() => {
    if (!authHydrated) return;
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate, authHydrated]);

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
