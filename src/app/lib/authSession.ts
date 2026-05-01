/**
 * Auth session + route guard (single source of truth). Does not import `useAuth` to avoid circular deps.
 */

export type SessionUserRole = "business" | "employee" | "platform_admin" | "admin" | "user";

/** Minimal user shape required for session derivation and guards. */
export type SessionUserLike = {
  role: SessionUserRole;
  isVerified: boolean;
  hasCompletedOnboarding: boolean;
};

/**
 * Canonical session shape for routing and UI.
 * `role` is `'user'` only when logged out (sentinel).
 */
export type AuthSession = {
  isAuthenticated: boolean;
  isEmailVerified: boolean;
  hasCompletedOnboarding: boolean;
  role: SessionUserRole;
};

const LOGGED_OUT_ROLE: SessionUserRole = "user";

export function deriveAuthSession(user: SessionUserLike | null): AuthSession {
  if (!user) {
    return {
      isAuthenticated: false,
      isEmailVerified: false,
      hasCompletedOnboarding: false,
      role: LOGGED_OUT_ROLE,
    };
  }

  const role = user.role;
  const isBizOrStaff = role === "business" || role === "employee";
  const isEmailVerified = isBizOrStaff ? user.isVerified === true : true;
  const hasCompletedOnboarding = role === "business" ? user.hasCompletedOnboarding === true : true;

  return {
    isAuthenticated: true,
    isEmailVerified,
    hasCompletedOnboarding,
    role,
  };
}

export type AuthGuardDecision =
  | { kind: "allow" }
  | { kind: "redirect"; to: string; reason: string };

/**
 * Centralized app-shell guard for business/employee protected routes.
 * Order: verify email → onboarding (business) → role match / home for role.
 *
 * Precondition: `user` is non-null (caller handles loading / unauthenticated).
 */
export function resolveAuthenticatedAppGuard(
  user: SessionUserLike,
  pathname: string,
  allowedRoles: Array<"business" | "employee">,
): AuthGuardDecision {
  const session = deriveAuthSession(user);
  const p = pathname;
  const r = session.role;
  const needsEmailGate = r === "business" || r === "employee";

  if (needsEmailGate && !session.isEmailVerified) {
    if (p === "/verify-email" || p === "/verify") {
      return { kind: "allow" };
    }
    return { kind: "redirect", to: "/verify-email", reason: "email_not_verified" };
  }

  if (r === "business") {
    if (!session.hasCompletedOnboarding) {
      if (p === "/onboarding") {
        return { kind: "allow" };
      }
      return { kind: "redirect", to: "/onboarding", reason: "onboarding_incomplete" };
    }
    if (p === "/onboarding") {
      return { kind: "redirect", to: "/dashboard", reason: "onboarding_already_complete" };
    }
  }

  if (r === "platform_admin" || r === "admin") {
    return { kind: "redirect", to: "/platform-admin/dashboard", reason: "wrong_shell_platform_admin" };
  }

  if (allowedRoles.includes(r as "business" | "employee")) {
    return { kind: "allow" };
  }

  if (r === "business") {
    return { kind: "redirect", to: "/dashboard", reason: "wrong_shell_need_business_home" };
  }
  if (r === "employee") {
    return { kind: "redirect", to: "/employee/dashboard", reason: "wrong_shell_need_employee_home" };
  }

  return { kind: "redirect", to: "/login", reason: "unknown_role" };
}
