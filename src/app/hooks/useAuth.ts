import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  registerAPI,
  loginAPI,
  oauthAPI,
  logoutAPI,
  refreshSessionAPI,
  patchMyOnboardingStatus,
  type AuthResponse,
} from "../lib/api";
import { deriveAuthSession, isPublicAuthenticationPath, type AuthSession } from "../lib/authSession";
import { authDebug } from "../lib/authDebugLog";
import { logClientError } from "../lib/clientLog";
import {
  fallbackMessageForHttpStatus,
  SERVICE_UNAVAILABLE_CLIENT_MESSAGE,
} from "../lib/errorMessages";

export type { AuthSession } from "../lib/authSession";

const AUTH_STORAGE_SYNC_EVENT = "caretip-auth-storage-sync";
const ACCESS_TOKEN_STORAGE_KEY = "caretip_token";
const USER_STORAGE_KEY = "caretip_user";

function readStoredAccessToken(): string | null {
  try {
    const t = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    return t?.trim() ? t.trim() : null;
  } catch {
    return null;
  }
}

function decodeJwtPayload(token: string): unknown | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, "=");
    const json = atob(padded);
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
}

function isJwtExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload !== "object") return false;
  const exp = (payload as { exp?: unknown }).exp;
  if (typeof exp !== "number") return false;
  return Date.now() >= exp * 1000;
}

function clearStoredSession() {
  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem("caretip_admin_token_backup");
    sessionStorage.removeItem("caretip_admin_user_backup");
  } catch {
    // ignore
  }
}

function loadUserFromStorage(): User | null {
  try {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
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
  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, data.token);
  const u = parseUser(data.user);
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(u));
  notifyAuthStorageSync();
  authDebug("auth_session_updated", { ...deriveAuthSession(u), source: "persist" });
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
   * Must match the server; missing fields are treated as unverified for staff/manager roles (see {@link parseUser}).
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

/** Normalize API auth user payloads for UI state (login, refresh, impersonation). */
export function userFromAuthResponse(data: AuthResponse["user"]): User {
  return parseUser(data);
}

function parseUser(data: AuthResponse["user"]): User {
  const ext = data as AuthResponse["user"] & {
    impersonation?: boolean;
    impersonatedBy?: string;
  };
  const role = mapApiRoleToUserRole(data.role);
  const kyc = data.businessVerificationStatus;
  /** Only verified when the API sends `true`. Missing/false keeps users on the verify-email gate until refresh matches the DB. */
  const emailVerified =
    typeof ext.emailVerified === "boolean"
      ? ext.emailVerified
      : role === "platform_admin" || role === "admin";
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
  /** False until the first session resolution pass finishes (no token path or refresh attempt). Route guards must wait on this, not on `user === null` alone. */
  const [authHydrated, setAuthHydrated] = useState(false);
  /**
   * True after bootstrap when there was no access token, or after `/api/auth/refresh` succeeded.
   * False when a stored token was present but refresh ultimately failed — dashboards must not call protected APIs until true.
   */
  const [sessionValidated, setSessionValidated] = useState(false);
  /** Bumped after successful credential-bearing mutations so an in-flight initial `refreshSession` cannot overwrite a newer session. */
  const sessionEpochRef = useRef(0);

  useEffect(() => {
    const onStorageSync = () => {
      setUser(loadUserFromStorage());
      setAuthHydrated(true);
      const token = readStoredAccessToken();
      // Treat storage sync as "validated" only if the token exists and isn't expired.
      // Otherwise, force the app into a logged-out, resolved state.
      if (!token) {
        setSessionValidated(true);
        return;
      }
      if (isJwtExpired(token)) {
        clearStoredSession();
        setUser(null);
        setSessionValidated(true);
        return;
      }
      setSessionValidated(true);
    };
    window.addEventListener(AUTH_STORAGE_SYNC_EVENT, onStorageSync);
    return () => window.removeEventListener(AUTH_STORAGE_SYNC_EVENT, onStorageSync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const epochAtStart = sessionEpochRef.current;
      const token = readStoredAccessToken();
      const hadToken = Boolean(token);

      try {
        if (!hadToken) {
          try {
            if (typeof localStorage !== "undefined" && localStorage.getItem(USER_STORAGE_KEY)) {
              localStorage.removeItem(USER_STORAGE_KEY);
              if (!cancelled) setUser(null);
            }
          } catch {
            // ignore
          }
          if (!cancelled) setSessionValidated(true);
          return;
        }

        // Never trust persisted state alone: if the JWT is already expired, clear immediately.
        if (token && isJwtExpired(token)) {
          clearStoredSession();
          notifyAuthStorageSync();
          if (!cancelled) setUser(null);
          if (!cancelled) setSessionValidated(true);
          if (!cancelled && !isPublicAuthenticationPath(window.location.pathname)) {
            navigate("/login", { replace: true });
          }
          return;
        }

        const data = await refreshSessionAPI();
        if (cancelled || sessionEpochRef.current !== epochAtStart) return;
        const u = persistAuthResponse(data);
        if (!cancelled) setUser(u);
        if (!cancelled) setSessionValidated(true);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        if (cancelled || sessionEpochRef.current !== epochAtStart) return;

        if (msg === SERVICE_UNAVAILABLE_CLIENT_MESSAGE) {
          toast.error(SERVICE_UNAVAILABLE_CLIENT_MESSAGE, { id: "caretip-auth-refresh-503" });
        } else if (msg === fallbackMessageForHttpStatus(500)) {
          toast.error(msg, { id: "caretip-auth-refresh-500" });
        } else {
          logClientError("useAuth.initialRefresh", err);
        }

        // If refresh fails, the session is not valid. Clear everything and move to logged-out.
        clearStoredSession();
        notifyAuthStorageSync();
        if (!cancelled) setUser(null);
        if (!cancelled) setSessionValidated(true);
        if (!cancelled && !isPublicAuthenticationPath(window.location.pathname)) {
          navigate("/login", { replace: true });
        }
      } finally {
        if (!cancelled) setAuthHydrated(true);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!authHydrated) return;
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      clearStoredSession();
    }
  }, [user, authHydrated]);

  const login = useCallback(async (
    email: string,
    password: string,
    intendedRole: "business" | "employee" | "platform_admin"
  ): Promise<User> => {
    const data = await loginAPI(email, password, intendedRole);
    const u = persistAuthResponse(data);
    sessionEpochRef.current += 1;
    setUser(u);
    setAuthHydrated(true);
    setSessionValidated(true);
    return u;
  }, []);

  const register = useCallback(async (payload: RegisterPayload): Promise<User> => {
    const data = await registerAPI(payload);
    const u = persistAuthResponse(data);
    sessionEpochRef.current += 1;
    setUser(u);
    setAuthHydrated(true);
    setSessionValidated(true);
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
    sessionEpochRef.current += 1;
    setUser(u);
    setAuthHydrated(true);
    setSessionValidated(true);
    return u;
  }, []);

  const logout = useCallback(() => {
    void logoutAPI();
    sessionEpochRef.current += 1;
    clearStoredSession();
    setUser(null);
    setSessionValidated(true);
    notifyAuthStorageSync();
    authDebug("auth_session_updated", { ...deriveAuthSession(null), source: "logout" });
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
    localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, backupToken);
    const restored = JSON.parse(backupUser) as User;
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(restored));
    sessionEpochRef.current += 1;
    setUser(restored);
    setSessionValidated(true);
    notifyAuthStorageSync();
    sessionStorage.removeItem("caretip_admin_token_backup");
    sessionStorage.removeItem("caretip_admin_user_backup");
    authDebug("auth_session_updated", { ...deriveAuthSession(restored), source: "exit_impersonation" });
    navigate("/platform-admin/dashboard");
  }, [navigate]);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((u) => (u ? { ...u, ...patch } : null));
  }, []);

  const setHasCompletedOnboarding = useCallback(async (next: boolean): Promise<User> => {
    try {
      const data = await patchMyOnboardingStatus(next);
      const u = persistAuthResponse(data);
      sessionEpochRef.current += 1;
      setUser(u);
      return u;
    } catch (err) {
      logClientError("useAuth.setHasCompletedOnboarding", err);
      throw err;
    }
  }, []);

  const replaceUser = useCallback((next: User) => {
    localStorage.setItem("caretip_user", JSON.stringify(next));
    sessionEpochRef.current += 1;
    setUser(next);
    setAuthHydrated(true);
    setSessionValidated(true);
    notifyAuthStorageSync();
  }, []);

  const refreshSession = useCallback(async (): Promise<User | null> => {
    try {
      const data = await refreshSessionAPI();
      const u = persistAuthResponse(data);
      setUser(u);
      setSessionValidated(true);
      return u;
    } catch (err) {
      logClientError("useAuth.refreshSession", err);
      const msg = err instanceof Error ? err.message : "";
      if (msg === SERVICE_UNAVAILABLE_CLIENT_MESSAGE) {
        toast.error(SERVICE_UNAVAILABLE_CLIENT_MESSAGE, { id: "caretip-auth-refresh-503" });
      }
      try {
        localStorage.removeItem("caretip_user");
        localStorage.removeItem("caretip_token");
        notifyAuthStorageSync();
      } catch {
        // ignore
      }
      setUser(null);
      setSessionValidated(false);
      return null;
    }
  }, []);

  /** Re-fetch the current session from the server (same as refreshSession). */
  const refetchUser = refreshSession;

  const authState = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading: !authHydrated,
    }),
    [user, authHydrated],
  );

  return {
    user,
    /** @deprecated Prefer `authState.isLoading` or `!authHydrated`. */
    isLoadingUser: !authHydrated,
    /** True while the first session resolution pass is in flight; route guards must wait and must not redirect. */
    isAuthLoading: !authHydrated,
    authHydrated,
    /** True when bootstrap refresh succeeded or there was no token; false when stored session failed validation. */
    sessionValidated,
    authState,
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

/** Canonical auth flags derived from `useAuth().user` (single model for UI + tests). */
export function useAuthSession(): AuthSession {
  const { user } = useAuth();
  return useMemo(() => deriveAuthSession(user), [user]);
}
