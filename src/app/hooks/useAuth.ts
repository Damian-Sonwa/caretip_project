import { useState, useEffect, useCallback, useMemo, useRef, useReducer } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  registerAPI,
  loginAPI,
  oauthAPI,
  logoutAPI,
  refreshSessionAPI,
  patchMyOnboardingStatus,
  clearClientSessionRevoked,
  clearClientAuthStorage,
  isClientSessionRevoked,
  type AuthResponse,
} from "../lib/api";
import {
  getAuthSessionFlags,
  markSessionBootstrapSettled,
  resetSessionBootstrap,
  runSessionBootstrapOnce,
  subscribeAuthSessionFlags,
} from "../lib/authSessionBootstrap";
import { deriveAuthSession, type AuthSession } from "../lib/authSession";
import { authDebug } from "../lib/authDebugLog";
import { logClientError } from "../lib/clientLog";
import {
  fallbackMessageForHttpStatus,
  SERVICE_UNAVAILABLE_CLIENT_MESSAGE,
  API_WAKEUP_NETWORK_MESSAGE,
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
  clearClientAuthStorage();
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
  clearClientSessionRevoked();
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
  preferredLocale?: string | null;
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
    preferredLocale?: string | null;
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
    preferredLocale: typeof ext.preferredLocale === "string" ? ext.preferredLocale : null,
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
  if (u.role === "platform_admin" || u.role === "admin") return "/platform-admin/dashboard";
  return "/dashboard";
}

function requestEmailLocale(i18nLang: string | undefined): "en" | "de" {
  return i18nLang?.toLowerCase().startsWith("de") ? "de" : "en";
}

function isTransientRefreshErrorMessage(msg: string): boolean {
  return (
    msg === SERVICE_UNAVAILABLE_CLIENT_MESSAGE ||
    msg === API_WAKEUP_NETWORK_MESSAGE ||
    msg === fallbackMessageForHttpStatus(500) ||
    msg === fallbackMessageForHttpStatus(503) ||
    msg === fallbackMessageForHttpStatus(504)
  );
}

export function useAuth() {
  const { i18n } = useTranslation();
  const requestLocale = requestEmailLocale(i18n.resolvedLanguage);
  const [user, setUser] = useState<User | null>(() => loadUserFromStorage());
  const [, syncAuthFlags] = useReducer((n: number) => n + 1, 0);
  const { authHydrated, sessionValidated } = getAuthSessionFlags();
  /** Bumped after successful credential-bearing mutations so an in-flight bootstrap cannot overwrite a newer session. */
  const sessionEpochRef = useRef(0);
  /** Re-read access token so proactive refresh + effects track rotation after login/refresh. */
  const accessTokenSnapshot = readStoredAccessToken();

  useEffect(() => subscribeAuthSessionFlags(() => syncAuthFlags()), []);

  useEffect(() => {
    const onStorageSync = () => {
      if (isClientSessionRevoked()) {
        clearStoredSession();
        setUser(null);
        return;
      }
      setUser(loadUserFromStorage());
    };
    window.addEventListener(AUTH_STORAGE_SYNC_EVENT, onStorageSync);
    return () => window.removeEventListener(AUTH_STORAGE_SYNC_EVENT, onStorageSync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const epochAtStart = sessionEpochRef.current;

    void runSessionBootstrapOnce(async () => {
      if (isClientSessionRevoked()) {
        clearStoredSession();
        return { kind: "unauthenticated" };
      }

      try {
        const data = await refreshSessionAPI();
        return { kind: "authenticated", data };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "";
        const hadLocalSession =
          Boolean(readStoredAccessToken()) || Boolean(loadUserFromStorage());

        if (isTransientRefreshErrorMessage(msg) && hadLocalSession) {
          if (msg === SERVICE_UNAVAILABLE_CLIENT_MESSAGE) {
            toast.error(SERVICE_UNAVAILABLE_CLIENT_MESSAGE, { id: "caretip-auth-refresh-503" });
          } else if (msg === fallbackMessageForHttpStatus(500)) {
            toast.error(msg, { id: "caretip-auth-refresh-500" });
          }
          logClientError("useAuth.sessionBootstrap.transient", err);
          return { kind: "transient_error" };
        }

        if (!isTransientRefreshErrorMessage(msg)) {
          logClientError("useAuth.sessionBootstrap", err);
        }

        clearStoredSession();
        return { kind: "unauthenticated" };
      }
    }).then((result) => {
      if (cancelled || sessionEpochRef.current !== epochAtStart) return;

      if (result.kind === "authenticated") {
        const u = persistAuthResponse(result.data);
        setUser(u);
        return;
      }

      if (result.kind === "unauthenticated") {
        setUser(null);
        return;
      }

      // Transient: keep optimistic user/token from storage; protected APIs may retry later.
      const stored = loadUserFromStorage();
      if (stored) setUser(stored);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  /** Proactively refresh shortly before access token expiry so API calls rarely see 401. */
  useEffect(() => {
    if (!user || !accessTokenSnapshot) return;
    const payload = decodeJwtPayload(accessTokenSnapshot);
    if (!payload || typeof payload !== "object") return;
    const exp = (payload as { exp?: unknown }).exp;
    if (typeof exp !== "number") return;
    const renewSkewMs = 90_000;
    const delay = Math.max(4_000, exp * 1000 - Date.now() - renewSkewMs);
    let cancelled = false;
    const id = window.setTimeout(() => {
      void (async () => {
        if (cancelled) return;
        try {
          const data = await refreshSessionAPI();
          sessionEpochRef.current += 1;
          const u = persistAuthResponse(data);
          if (!cancelled) setUser(u);
        } catch {
          // Leave handling to the next API 401 + silent refresh, or bootstrap on reload.
        }
      })();
    }, delay);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [user?.id, accessTokenSnapshot]);

  useEffect(() => {
    if (!authHydrated || !sessionValidated) return;
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      clearStoredSession();
    }
  }, [user, authHydrated, sessionValidated]);

  const login = useCallback(async (
    email: string,
    password: string,
    intendedRole: "business" | "employee" | "platform_admin"
  ): Promise<User> => {
    const data = await loginAPI(email, password, intendedRole, requestLocale);
    const u = persistAuthResponse(data);
    sessionEpochRef.current += 1;
    setUser(u);
    markSessionBootstrapSettled();
    return u;
  }, [requestLocale]);

  const register = useCallback(async (payload: RegisterPayload): Promise<User> => {
    const data = await registerAPI({ ...payload, locale: requestLocale });
    const u = persistAuthResponse(data);
    sessionEpochRef.current += 1;
    setUser(u);
    markSessionBootstrapSettled();
    return u;
  }, [requestLocale]);

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
      locale: requestLocale,
    });
    const u = persistAuthResponse(data);
    sessionEpochRef.current += 1;
    setUser(u);
    markSessionBootstrapSettled();
    return u;
  }, [requestLocale]);

  const logout = useCallback(async () => {
    sessionEpochRef.current += 1;
    resetSessionBootstrap();
    setUser(null);
    await logoutAPI();
    clearStoredSession();
    markSessionBootstrapSettled();
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
    markSessionBootstrapSettled();
    notifyAuthStorageSync();
    sessionStorage.removeItem("caretip_admin_token_backup");
    sessionStorage.removeItem("caretip_admin_user_backup");
    authDebug("auth_session_updated", { ...deriveAuthSession(restored), source: "exit_impersonation" });
    window.location.assign("/platform-admin/dashboard");
  }, []);

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
    markSessionBootstrapSettled();
    notifyAuthStorageSync();
  }, []);

  const refreshSession = useCallback(async (): Promise<User | null> => {
    try {
      const data = await refreshSessionAPI();
      const u = persistAuthResponse(data);
      sessionEpochRef.current += 1;
      setUser(u);
      markSessionBootstrapSettled();
      return u;
    } catch (err) {
      logClientError("useAuth.refreshSession", err);
      const msg = err instanceof Error ? err.message : "";
      if (msg === SERVICE_UNAVAILABLE_CLIENT_MESSAGE) {
        toast.error(SERVICE_UNAVAILABLE_CLIENT_MESSAGE, { id: "caretip-auth-refresh-503" });
      }
      if (isTransientRefreshErrorMessage(msg)) {
        return loadUserFromStorage();
      }
      clearStoredSession();
      setUser(null);
      markSessionBootstrapSettled();
      return null;
    }
  }, []);

  /** Re-fetch the current session from the server (same as refreshSession). */
  const refetchUser = refreshSession;

  const authReady = authHydrated && sessionValidated;

  const authState = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading: !authReady,
    }),
    [user, authReady],
  );

  return {
    user,
    /** @deprecated Prefer `authState.isLoading` or `!authReady`. */
    isLoadingUser: !authReady,
    /** True while session restoration is in flight; route guards must wait and must not redirect. */
    isAuthLoading: !authReady,
    authHydrated,
    /** @deprecated Always false; silent refresh — do not gate UI on this. */
    sessionChecking: false,
    /** True after bootstrap refresh completes (success, invalid, or transient). */
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
