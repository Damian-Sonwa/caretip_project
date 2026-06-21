import { useAuth } from "./useAuth";

/**
 * Auth snapshot for protected pages. Redirects are handled by {@link ProtectedRoute} only —
 * imperative navigate here duplicated guards and caused back-button / flicker issues.
 */
export function useRequireAuth() {
  const {
    user,
    authHydrated,
    sessionValidated,
    authStatus,
    authBootstrapComplete,
    authReady,
    isAuthLoading,
    isBusiness,
    isEmployee,
    logout,
    updateUser,
    exitImpersonation,
  } = useAuth();

  return {
    user,
    authHydrated,
    sessionValidated,
    authStatus,
    authBootstrapComplete,
    authReady,
    isAuthLoading,
    isBusiness,
    isEmployee,
    logout,
    updateUser,
    exitImpersonation,
  };
}
