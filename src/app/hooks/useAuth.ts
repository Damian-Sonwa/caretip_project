import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import {
  registerAPI,
  loginAPI,
  oauthAPI,
  logoutAPI,
  refreshSessionAPI,
  patchMyOnboardingStatus,
  type AuthResponse,
} from "../lib/api";
import { logClientError } from "../lib/clientLog";

const AUTH_STORAGE_SYNC_EVENT = "caretip-auth-storage-sync";

function loadUserFromStorage(): User | null {
  try {
    const saved = localStorage.getItem("caretip_user");
    if (!saved) return null;
    return JSON.parse(saved) as User;
  } catch (err) {
    logClientError("useAuth.localStorage", err);
    return null;
  }
}

function notifyAuthStorageSync() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_STORAGE_SYNC_EVENT));
}

/** Persist access token + normalized user to localStorage and sync all `useAuth()` instances. */
function persistAuthResponse(data: AuthResponse): User {
  localStorage.setItem("caretip_token", data.token);
  const u = parseUser(data.user);
  localStorage.setItem("caretip_user", JSON.stringify(u));
  notifyAuthStorageSync();
  return u;
}

/** API roles plus demo-only values used by admin UI / RoleSwitcher */
export type UserRole = "business" | "employee" | "platform_admin" | "admin" | "user";

/** KYC gate for venue managers (`verified` in DB → APPROVED). */
export type BusinessAccountStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /**
   * Mirrors backend `users.email_verified`. When false, app routes stay off dashboards until verified.
   * Older saved sessions without this field are treated as verified in {@link parseUser}.
   */
  emailVerified?: boolean;
  /** Preferred alias for UI logic. Always set from `emailVerified`. */
  isVerified: boolean;
  /** Used for business users to control whether `/onboarding` should show. */
  hasCompletedOnboarding: boolean;
  businessId?: string;
  employeeId?: string;
  businessName?: string;
  avatar?: string;
  /** Derived from `businessVerificationStatus` for managers; used with `/verification-pending` gate. */
  status?: BusinessAccountStatus;
  /** True when platform admin is viewing as a business manager (JWT impersonation). */
  impersonation?: boolean;
  impersonatedBy?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
  role: "business" | "employee";
  businessName?: string;
  businessType?: string;
  location?: string;
  inviteCode?: string;
}

/** Map Prisma / API role strings to UI `UserRole` (business / employee / platform_admin). */
function mapApiRoleToUserRole(apiRole: string): UserRole {
  switch (apiRole) {
    case "SUPER_ADMIN":
      return "platform_admin";
    case "MANAGER":
      return "business";
    case "EMPLOYEE":
      return "employee";
    default:
      return apiRole as UserRole;
  }
}

function mapVerificationToStatus(
  v: "pending" | "verified" | "rejected" | undefined
): BusinessAccountStatus | undefined {
  if (v === "pending") return "PENDING";
  if (v === "verified") return "APPROVED";
  if (v === "rejected") return "REJECTED";
  return undefined;
}

function parseUser(data: AuthResponse["user"]): User {
  const ext = data as AuthResponse["user"] & {
    impersonation?: boolean;
    impersonatedBy?: string;
  };
  const role = mapApiRoleToUserRole(data.role);
  const kyc = data.businessVerificationStatus;
  const emailVerified =
    typeof ext.emailVerified === "boolean" ? ext.emailVerified : true;
  const isVerified = emailVerified;
  const hasCompletedOnboarding =
    role === "business" ? (typeof ext.hasCompletedOnboarding === "boolean" ? ext.hasCompletedOnboarding : false) : true;
  const base: User = {
    id: data.id,
    name: data.name,
    email: data.email,
    role,
    emailVerified,
    isVerified,
    hasCompletedOnboarding,
    businessId: data.businessId,
    employeeId: data.employeeId,
    avatar: data.avatar ?? undefined,
    impersonation: ext.impersonation,
    impersonatedBy: ext.impersonatedBy,
    ...(role === "business" && mapVerificationToStatus(kyc) ? { status: mapVerificationToStatus(kyc)! } : {}),
  };
  // Super admins must not carry business/employee scope in client state (API maps SUPER_ADMIN → platform_admin).
  if (role === "platform_admin" && !ext.impersonation) {
    return { ...base, businessId: undefined, employeeId: undefined, businessName: undefined, status: undefined };
  }
  return base;
}

export function getPostAuthRedirect(u: User): string {
  if (!u.isVerified) return "/verify-email";
  if (u.role === "business" && !u.hasCompletedOnboarding) return "/onboarding";
  if (u.role === "employee") return "/employee/dashboard";
  return "/dashboard";
}

export function useAuth() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => loadUserFromStorage());
  const [isLoadingUser, setIsLoadingUser] = useState(() => {
    try {
      return typeof localStorage !== "undefined" && !!localStorage.getItem("caretip_token");
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const onStorageSync = () => {
      setUser(loadUserFromStorage());
    };
    window.addEventListener(AUTH_STORAGE_SYNC_EVENT, onStorageSync);
    return () => window.removeEventListener(AUTH_STORAGE_SYNC_EVENT, onStorageSync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (typeof localStorage !== "undefined" && localStorage.getItem("caretip_token")) {
          await refreshSessionAPI().then((data) => {
            const u = persistAuthResponse(data);
            if (!cancelled) setUser(u);
          });
        }
      } catch (err) {
        // If the backend is temporarily unavailable (503), don't spam logs or disrupt the session.
        const msg = err instanceof Error ? err.message : "";
        const lower = msg.toLowerCase();
        if (lower.includes("invalid or expired token") || lower.includes("authentication required")) {
          try {
            localStorage.removeItem("caretip_user");
            localStorage.removeItem("caretip_token");
            notifyAuthStorageSync();
          } catch {
            // ignore
          }
          if (!cancelled) setUser(null);
        }
        if (!msg.toLowerCase().includes("service temporarily unavailable")) {
          logClientError("useAuth.initialRefresh", err);
        }
      } finally {
        if (!cancelled) setIsLoadingUser(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem("caretip_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("caretip_user");
      localStorage.removeItem("caretip_token");
    }
  }, [user]);

  const login = useCallback(async (
    email: string,
    password: string,
    intendedRole: "business" | "employee" | "platform_admin"
  ): Promise<User> => {
    const data = await loginAPI(email, password, intendedRole);
    const u = persistAuthResponse(data);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<User> => {
    const data = await registerAPI(payload);
    const u = persistAuthResponse(data);
    setUser(u);
    return u;
  }, []);

  const loginWithOAuth = useCallback(async (
    provider: "google",
    idToken: string,
    options: {
      isLogin: boolean;
      intendedRole: "business" | "employee";
      name?: string;
      businessName?: string;
      businessType?: string;
      location?: string;
      inviteCode?: string;
    }
  ): Promise<User> => {
    const data = await oauthAPI({
      provider,
      idToken,
      isLogin: options.isLogin,
      intendedRole: options.intendedRole,
      name: options.name,
      businessName: options.businessName,
      businessType: options.businessType,
      location: options.location,
      inviteCode: options.inviteCode,
    });
    const u = persistAuthResponse(data);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    void logoutAPI();
    localStorage.removeItem("caretip_user");
    localStorage.removeItem("caretip_token");
    sessionStorage.removeItem("caretip_admin_token_backup");
    sessionStorage.removeItem("caretip_admin_user_backup");
    setUser(null);
    notifyAuthStorageSync();
  }, []);

  const switchRole = (newRole: UserRole) => {
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  const isBusiness = user?.role === "business";
  const isEmployee = user?.role === "employee";
  const isPlatformAdmin = user?.role === "platform_admin";

  /** Restore platform admin session after impersonation (tokens stored in sessionStorage). */
  const exitImpersonation = useCallback(() => {
    const backupToken = sessionStorage.getItem("caretip_admin_token_backup");
    const backupUser = sessionStorage.getItem("caretip_admin_user_backup");
    if (!backupToken || !backupUser) return;
    localStorage.setItem("caretip_token", backupToken);
    const restored = JSON.parse(backupUser) as User;
    localStorage.setItem("caretip_user", JSON.stringify(restored));
    setUser(restored);
    notifyAuthStorageSync();
    sessionStorage.removeItem("caretip_admin_token_backup");
    sessionStorage.removeItem("caretip_admin_user_backup");
    navigate("/platform-admin/dashboard");
  }, [navigate]);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((u) => (u ? { ...u, ...patch } : null));
  }, []);

  const setHasCompletedOnboarding = useCallback(async (next: boolean): Promise<User> => {
    try {
      const data = await patchMyOnboardingStatus(next);
      const u = persistAuthResponse(data);
      setUser(u);
      return u;
    } catch (err) {
      logClientError("useAuth.setHasCompletedOnboarding", err);
      throw err;
    }
  }, []);

  const replaceUser = useCallback((next: User) => {
    localStorage.setItem("caretip_user", JSON.stringify(next));
    setUser(next);
    notifyAuthStorageSync();
  }, []);

  const refreshSession = useCallback(async (): Promise<User | null> => {
    try {
      const data = await refreshSessionAPI();
      const u = persistAuthResponse(data);
      setUser(u);
      return u;
    } catch (err) {
      logClientError("useAuth.refreshSession", err);
      return null;
    }
  }, []);

  /** Re-fetch the current session from the server (same as refreshSession). */
  const refetchUser = refreshSession;

  return {
    user,
    isLoadingUser,
    isBusiness,
    isEmployee,
    isPlatformAdmin,
    login,
    register,
    loginWithOAuth,
    logout,
    refreshSession,
    refetchUser,
    switchRole,
    updateUser,
    setHasCompletedOnboarding,
    replaceUser,
    exitImpersonation,
  };
}
