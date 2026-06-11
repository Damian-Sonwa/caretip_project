/**
 * Auth session + route guard (single source of truth). Does not import `useAuth` to avoid circular deps.
 */

export type SessionUserRole = "business" | "employee" | "platform_admin" | "admin" | "user";

/** Minimal user shape required for session derivation and guards. */
export type BusinessKycStatus = "PENDING" | "APPROVED" | "REJECTED";

export type SessionUserLike = {
  role: SessionUserRole;
  isVerified: boolean;
  hasCompletedOnboarding: boolean;
  /** Manager KYC gate — mirrors `User.status` from auth payload. */
  status?: BusinessKycStatus;
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

/** Auth lifecycle for route guards and shells — wait on `initializing` before redirecting. */
export type AuthStatus = "initializing" | "authenticated" | "unauthenticated";

export function resolveAuthStatus(
  user: SessionUserLike | null,
  flags: {
    authHydrated: boolean;
    sessionValidated: boolean;
    /** Storage still holds credentials while user snapshot is empty (bootstrap race). */
    pendingStoredSession?: boolean;
  },
): AuthStatus {
  if (!flags.authHydrated || !flags.sessionValidated) return "initializing";
  if (flags.pendingStoredSession && !user) return "initializing";
  return user ? "authenticated" : "unauthenticated";
}

/**
 * Auth-related URLs where an existing session must not trigger automatic redirects
 * to onboarding or the app shell (user may intend to sign in as another account).
 */
export function isPublicAuthenticationPath(pathname: string): boolean {
  const p = pathname;
  if (p === "/login" || p === "/signup" || p === "/auth" || p === "/forgot-password") return true;
  if (p === "/join/signup" || p === "/employee/login") return true;
  if (p === "/business/login") return true; // legacy; route redirects to /login
  if (p.startsWith("/reset-password/")) return true;
  return false;
}

/**
 * True when an existing session is for the same lane as the business/staff auth UI
 * (so auto-redirect to that dashboard is appropriate).
 */
export function sessionMatchesBusinessStaffAuthTarget(
  sessionRole: SessionUserRole,
  authPageRole: "business" | "employee",
): boolean {
  if (authPageRole === "business") return sessionRole === "business";
  if (authPageRole === "employee") return sessionRole === "employee";
  return false;
}

/** Sign-in URL for an existing session role (used when guards redirect unauthenticated users). */
export function getLoginPathForSessionRole(role: SessionUserRole): string {
  if (role === "platform_admin" || role === "admin") return "/platform-admin/login";
  if (role === "employee") return "/employee/login";
  if (role === "business") return "/login";
  return "/login";
}

/** Sign-in URL for a protected route's allowed roles. */
export function getLoginPathForAllowedRoles(
  allowedRoles: Array<"business" | "employee">,
): string {
  if (allowedRoles.length === 1) {
    return getLoginPathForSessionRole(allowedRoles[0]);
  }
  return "/login";
}

/** Best-effort login URL from the app path the user was trying to open. */
export function getLoginPathFromAppPath(pathname: string): string {
  if (pathname.startsWith("/platform-admin")) return "/platform-admin/login";
  if (pathname.startsWith("/employee")) return "/employee/login";
  return "/login";
}

export function isPlatformAdminSessionRole(sessionRole: SessionUserRole): boolean {
  return sessionRole === "platform_admin" || sessionRole === "admin";
}

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
  | { kind: "redirect"; to: string; reason: string }
  | { kind: "wait"; reason: string };

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
  options?: { onboardingStatusFromServer?: boolean },
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
    const onboardingFromServer = options?.onboardingStatusFromServer === true;
    const kycStatus = user.status;
    if (!session.hasCompletedOnboarding) {
      if (p === "/onboarding" || isPublicAuthenticationPath(p)) {
        return { kind: "allow" };
      }
      // Never trap users in onboarding from stale localStorage — wait for API refresh.
      if (!onboardingFromServer) {
        return { kind: "wait", reason: "onboarding_status_unconfirmed" };
      }
      return { kind: "redirect", to: "/onboarding", reason: "onboarding_incomplete" };
    }
    if (p === "/onboarding") {
      if (!onboardingFromServer) {
        return { kind: "wait", reason: "onboarding_status_unconfirmed" };
      }
      if (kycStatus === "PENDING" || kycStatus === "REJECTED") {
        return { kind: "redirect", to: "/verification-pending", reason: "onboarding_complete_kyc_pending" };
      }
      return { kind: "redirect", to: "/dashboard", reason: "onboarding_already_complete" };
    }
    if (kycStatus === "PENDING" || kycStatus === "REJECTED") {
      if (p === "/verification-pending") {
        return { kind: "allow" };
      }
      if (p.startsWith("/dashboard")) {
        return { kind: "redirect", to: "/verification-pending", reason: "kyc_pending" };
      }
    }
    if (p === "/verification-pending" && kycStatus === "APPROVED") {
      return { kind: "redirect", to: "/dashboard", reason: "kyc_approved" };
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

  return {
    kind: "redirect",
    to: getLoginPathForSessionRole(r),
    reason: "unknown_role",
  };
}
