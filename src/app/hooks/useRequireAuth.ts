import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "./useAuth";

/** Redirects to /auth if user is not logged in. Call at the start of protected pages. */
export function useRequireAuth() {
  const { user, isBusiness, isEmployee, logout, updateUser, exitImpersonation } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  return { user, isBusiness, isEmployee, logout, updateUser, exitImpersonation };
}
