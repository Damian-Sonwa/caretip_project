/**
 * API client for Caretip backend.
 * Base URL: VITE_API_URL (e.g. http://localhost:3001)
 * All errors are translated to user-friendly messages before being thrown.
 */

import {
  toUserFriendlyMessage,
  fallbackMessageForHttpStatus,
  SERVICE_UNAVAILABLE_CLIENT_MESSAGE,
} from "./errorMessages";
import { ApiRequestError, EMAIL_NOT_VERIFIED_CODE } from "./apiError";
import { resolveApiBaseUrl } from "./apiOrigin";
import { logClientError } from "./clientLog";
import { authDebug } from "./authDebugLog";

const AUTH_REFRESH_PATHNAME = "/api/auth/refresh";

function isAuthRefreshRequestUrl(url: string): boolean {
  return requestUrlPathname(url) === AUTH_REFRESH_PATHNAME;
}

type RefreshSessionResult =
  | { ok: true; data: AuthResponse }
  | { ok: false; status: number; shouldClearSession: boolean };

/** Single-flight refresh: shared by `refreshSessionAPI` and 401 recovery (`refreshAccessToken`). */
let refreshSingleton: Promise<RefreshSessionResult> | null = null;

function parseAuthRefreshPayload(data: unknown): AuthResponse | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (typeof d.token !== "string" || !d.token.trim()) return null;
  const u = d.user;
  if (!u || typeof u !== "object") return null;
  const ur = u as Record<string, unknown>;
  if (typeof ur.id !== "string" || typeof ur.email !== "string" || typeof ur.role !== "string") return null;
  return data as AuthResponse;
}

/**
 * POST /api/auth/refresh with bounded retries.
 * UX goal: keep startup fast — at most one retry for transient failures.
 * Stops after auth rejection (401/403) immediately.
 * After final failure: caller should clear session (handled in {@link ensureRefreshedSession}).
 */
async function runRefreshAuthWithRetries(): Promise<RefreshSessionResult> {
  for (let attempt = 0; attempt < 2; attempt++) {
    if (attempt > 0) {
      // Short backoff to avoid long "stuck loading" sessions on flaky networks.
      await new Promise((r) => setTimeout(r, 500));
    }

    let res: Response;
    try {
      const refreshHeaders: Record<string, string> = { "Content-Type": "application/json" };
      const existing = getToken();
      if (existing?.trim()) {
        refreshHeaders.Authorization = `Bearer ${existing.trim()}`;
      }
      res = await fetch(apiPath(AUTH_REFRESH_PATHNAME), {
        method: "POST",
        headers: refreshHeaders,
        credentials: "include",
      });
    } catch (err) {
      logClientError("api.runRefreshAuthWithRetries.fetch", err, { attempt });
      if (attempt === 1) {
        return { ok: false, shouldClearSession: true, status: 0 };
      }
      continue;
    }

    if (res.ok) {
      const raw = await res.json().catch(() => null);
      const parsed = parseAuthRefreshPayload(raw);
      if (parsed) {
        setToken(parsed.token);
        return { ok: true, data: parsed };
      }
      return { ok: false, shouldClearSession: true, status: res.status };
    }

    if (res.status === 401 || res.status === 403) {
      return { ok: false, shouldClearSession: true, status: res.status };
    }

    const transient =
      res.status === 503 ||
      res.status === 502 ||
      res.status === 504 ||
      res.status === 429 ||
      res.status >= 500;

    if (transient) {
      if (attempt < 1) continue;
      return { ok: false, shouldClearSession: true, status: res.status };
    }

    return { ok: false, shouldClearSession: true, status: res.status };
  }

  return { ok: false, shouldClearSession: true, status: 0 };
}

async function ensureRefreshedSession(): Promise<RefreshSessionResult> {
  if (refreshSingleton) return refreshSingleton;
  refreshSingleton = (async (): Promise<RefreshSessionResult> => {
    try {
      const out = await runRefreshAuthWithRetries();
      if (!out.ok && out.shouldClearSession) {
        clearAuthStorage();
      }
      return out;
    } finally {
      refreshSingleton = null;
    }
  })();
  return refreshSingleton;
}

async function refreshAccessToken(): Promise<{ token: string | null; shouldClearAccessToken: boolean }> {
  const r = await ensureRefreshedSession();
  if (r.ok) return { token: r.data.token, shouldClearAccessToken: false };
  return { token: null, shouldClearAccessToken: r.shouldClearSession };
}

/** Absolute path (starts with /) or full URL; honors Vite proxy when base is empty. */
function apiPath(path: string): string {
  const base = resolveApiBaseUrl();
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}

function getToken(): string | null {
  return localStorage.getItem("caretip_token");
}

function setToken(token: string | null): void {
  if (token && token.trim()) localStorage.setItem("caretip_token", token);
  else localStorage.removeItem("caretip_token");
}

function clearAuthStorage(): void {
  try {
    localStorage.removeItem("caretip_token");
    localStorage.removeItem("caretip_user");
    // Keep in sync with useAuth.ts
    window.dispatchEvent(new CustomEvent("caretip-auth-storage-sync"));
  } catch {
    // ignore
  }
}

/** Pathname for CareTip API URLs whether `url` is relative or absolute (e.g. `VITE_API_URL` + `/api/...`). */
function requestUrlPathname(url: string): string {
  try {
    const base =
      typeof window !== "undefined" && window.location?.origin ? window.location.origin : "http://localhost";
    return new URL(url, base).pathname;
  } catch {
    if (url.startsWith("/")) {
      const q = url.indexOf("?");
      const path = q === -1 ? url : url.slice(0, q);
      const h = path.indexOf("#");
      return h === -1 ? path : path.slice(0, h);
    }
    return "";
  }
}

function requestUsesCaretipProtectedApi(url: string): boolean {
  const p = requestUrlPathname(url);
  return p.startsWith("/api/") || p.startsWith("/uploads/");
}

/**
 * Merge the latest access token from storage into `init` immediately before `fetch`.
 * Overwrites any stale `Authorization` header from a captured `RequestInit`.
 */
function attachLatestBearer(init?: RequestInit): RequestInit {
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem("caretip_auth_debug") === "1") {
      const t = getToken();
      console.log("Auth token:", t && t.trim() ? "present" : "absent");
    }
  } catch {
    // ignore
  }

  const next: RequestInit = { ...(init ?? {}) };
  const token = getToken()?.trim();
  const headers = new Headers();
  const h = next.headers;
  if (h instanceof Headers) {
    h.forEach((v, k) => {
      if (k.toLowerCase() !== "authorization") headers.set(k, v);
    });
  } else if (Array.isArray(h)) {
    for (const [k, v] of h) {
      if (String(k).toLowerCase() !== "authorization") headers.set(k, v);
    }
  } else if (h && typeof h === "object") {
    for (const [k, v] of Object.entries(h as Record<string, string>)) {
      if (k.toLowerCase() !== "authorization" && v != null) headers.set(k, String(v));
    }
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);
  next.headers = headers;
  return next;
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

/** Bearer only — use with FormData (do not set Content-Type). */
function getAuthHeadersOnly(): HeadersInit {
  const headers: HeadersInit = {};
  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

async function handleRes<T>(res: Response): Promise<T> {
  const ct = res.headers.get("content-type") ?? "";
  let data: unknown = {};
  if (ct.includes("application/json")) {
    data = await res.json().catch(() => ({}));
  } else {
    const text = await res.text().catch(() => "");
    data = text.trim() ? { message: text.trim().slice(0, 300) } : {};
  }
  if (!res.ok) {
    logClientError("api.handleRes", new Error(`HTTP ${res.status}`), {
      status: res.status,
      url: res.url,
      body: data,
    });
    const body = data as { message?: string; code?: string; canResend?: boolean };
    const bodyMsg = body.message?.trim();
    const fromStatus = fallbackMessageForHttpStatus(res.status);
    const statusText = res.statusText?.trim();
    const base =
      bodyMsg ||
      fromStatus ||
      (statusText && statusText.length > 0 && statusText !== "Unknown" ? statusText : "") ||
      `Request failed (${res.status})`;
    if (body.code === EMAIL_NOT_VERIFIED_CODE) {
      throw new ApiRequestError(base, res.status, body.code, body.canResend === true);
    }
    throw new Error(base);
  }
  return data as T;
}

function apiConfigHintForFailedFetch(url: string): string {
  if (!url.startsWith("/api")) return "";
  if (import.meta.env.DEV) {
    return " In local dev, relative /api URLs are proxied by Vite to the backend (see vite.config.ts). Start the API on port 3001 (e.g. from the backend folder: npm run dev). If .env sets VITE_API_URL, it must be a reachable http(s) URL or omit it to use the proxy.";
  }
  return " For this deployed build, set VITE_API_URL in your host (e.g. Netlify: Site configuration → Environment variables) to your backend origin, e.g. https://your-api.onrender.com. Then trigger a new deploy.";
}

type CaretipRequestInit = RequestInit & { __caretipRetried?: boolean; __caretipDelayedRetried?: boolean };

/** Wraps fetch + handleRes and translates network/API errors to user-friendly messages */
async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  const initFlags = init as CaretipRequestInit | undefined;

  try {
    res = await fetch(url, attachLatestBearer(init));
  } catch (err) {
    logClientError("api.apiRequest", err, { url });
    const baseMsg = toUserFriendlyMessage(err);
    throw new Error(baseMsg + apiConfigHintForFailedFetch(url));
  }

  if (res.status === 401) {
    const isCaretipApi = requestUsesCaretipProtectedApi(url);
    const isAuthRefresh = isAuthRefreshRequestUrl(url);
    const tokenAtStart = getToken();
    const tokenIsSet = typeof tokenAtStart === "string" && tokenAtStart.trim().length > 0;
    const canAttempt = tokenIsSet && isCaretipApi;
    const alreadyRetried = initFlags?.__caretipRetried === true;
    let refreshDeemedInvalid = false;

    authDebug("apiRequest 401", {
      url,
      pathname: requestUrlPathname(url),
      isCaretipApi,
      hasToken: tokenIsSet,
      isAuthRefresh,
    });

    if (isAuthRefresh && isCaretipApi) {
      refreshDeemedInvalid = true;
      clearAuthStorage();
    } else if (canAttempt && !alreadyRetried) {
      const { token: nextToken, shouldClearAccessToken } = await refreshAccessToken();
      if (shouldClearAccessToken) refreshDeemedInvalid = true;
      if (nextToken) {
        const retriedInit: CaretipRequestInit = { ...(init ?? {}), __caretipRetried: true };
        res = await fetch(url, attachLatestBearer(retriedInit));
      } else if (shouldClearAccessToken) {
        clearAuthStorage();
      }
    }

    // If we're still unauthorized, do a single short-delay retry before clearing auth.
    // This avoids \"logout on first login\" caused by timing/race conditions around initial auth state.
    if (!isAuthRefresh && canAttempt && res.status === 401) {
      const alreadyDelayedRetry = initFlags?.__caretipDelayedRetried === true;
      if (!alreadyDelayedRetry) {
        await new Promise((r) => setTimeout(r, 250));
        const delayedInit: CaretipRequestInit = { ...(init ?? {}), __caretipDelayedRetried: true };
        res = await fetch(url, attachLatestBearer(delayedInit));
      }
    }

    // Clear session only when the refresh flow marked tokens invalid, or no token remains.
    // Avoids logging users out on a stray 401 while a token is still present (e.g. permission mismatch).
    if (res.status === 401 && isCaretipApi) {
      const t = getToken()?.trim();
      if (!t || refreshDeemedInvalid) {
        clearAuthStorage();
      }
    }
  }

  return handleRes<T>(res);
}

/** Fetch a protected file (PDF/image) with Bearer auth and return an object URL. */
export async function fetchAuthedObjectUrl(inputUrl: string): Promise<string> {
  const url = apiPath(inputUrl);
  const baseGet: RequestInit = { method: "GET", credentials: "include" };
  let res = await fetch(url, attachLatestBearer(baseGet));
  let refreshDeemedInvalid = false;

  if (res.status === 401 && requestUsesCaretipProtectedApi(url)) {
    const hadToken = Boolean(getToken()?.trim());
    if (hadToken) {
      const { token: nextToken, shouldClearAccessToken } = await refreshAccessToken();
      if (shouldClearAccessToken) refreshDeemedInvalid = true;
      if (nextToken) {
        res = await fetch(url, attachLatestBearer(baseGet));
      } else if (shouldClearAccessToken) {
        clearAuthStorage();
      }
    }
  }

  if (res.status === 401 && requestUsesCaretipProtectedApi(url)) {
    const t = getToken()?.trim();
    if (!t || refreshDeemedInvalid) {
      clearAuthStorage();
    }
  }

  if (!res.ok) {
    // Reuse error formatting for consistent messages.
    await handleRes(res);
    throw new Error("Failed to fetch file");
  }

  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// Auth
export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
    name: string;
    emailVerified?: boolean;
    hasCompletedOnboarding?: boolean;
    businessId?: string;
    employeeId?: string;
    avatar?: string | null;
    impersonation?: boolean;
    impersonatedBy?: string;
    /** Backend Prisma enum; managers only. */
    businessVerificationStatus?: "pending" | "verified" | "rejected";
  };
}

export async function registerAPI(payload: {
  email: string;
  password: string;
  name?: string;
  role: "business" | "employee";
  inviteCode?: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(apiPath("/api/auth/register"), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
    credentials: "include",
  });
}

/** Backend Prisma enum; API sign-in rejects frontend labels (business / employee / platform_admin). */
function toBackendIntendedRole(
  intendedRole: "business" | "employee" | "platform_admin",
): "MANAGER" | "EMPLOYEE" | "SUPER_ADMIN" {
  switch (intendedRole) {
    case "business":
      return "MANAGER";
    case "employee":
      return "EMPLOYEE";
    case "platform_admin":
      return "SUPER_ADMIN";
    default:
      return "EMPLOYEE";
  }
}

export async function loginAPI(
  email: string,
  password: string,
  intendedRole: "business" | "employee" | "platform_admin"
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(apiPath("/api/auth/signin"), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      email,
      password,
      intendedRole: toBackendIntendedRole(intendedRole),
    }),
    credentials: "include",
  });
}

export async function logoutAPI(): Promise<void> {
  try {
    await fetch(apiPath("/api/auth/logout"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
  } catch (err) {
    logClientError("api.logoutAPI", err);
  }
}

export async function resendVerificationEmailAPI(
  email: string,
  password: string
): Promise<{ ok: boolean; message: string }> {
  return apiRequest<{ ok: boolean; message: string }>(apiPath("/api/auth/resend-verification-email"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: "include",
  });
}

/** While logged in with an unverified account (e.g. check-email page after signup). Uses Bearer token. */
export async function resendVerificationEmailSessionAPI(): Promise<{ ok: boolean; message: string }> {
  return apiRequest<{ ok: boolean; message: string }>(apiPath("/api/auth/resend-verification-email/session"), {
    method: "POST",
    headers: getHeaders(),
    body: "{}",
    credentials: "include",
  });
}

export { ApiRequestError, EMAIL_NOT_VERIFIED_CODE, isApiRequestError } from "./apiError";

export async function requestPasswordReset(email: string): Promise<{ ok: boolean; message: string }> {
  return apiRequest<{ ok: boolean; message: string }>(apiPath("/api/auth/forgot-password"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
    credentials: "include",
  });
}

export async function resetPasswordWithToken(
  token: string,
  password: string
): Promise<{ ok: boolean; message: string }> {
  return apiRequest<{ ok: boolean; message: string }>(apiPath("/api/auth/reset-password"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
    credentials: "include",
  });
}

export async function activateEmployeeWithToken(
  token: string,
  password: string
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(apiPath("/api/auth/activate-employee"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
    credentials: "include",
  });
}

/** Deduplicate in-flight verification for the same token (React StrictMode / effect retries / double navigation). */
const verifyEmailInFlight = new Map<string, Promise<{ ok: true; message: string }>>();

export async function verifyEmailWithToken(token: string): Promise<{ ok: true; message: string }> {
  const key = String(token ?? "").trim();
  if (!key) {
    return Promise.reject(new Error("Verification link is invalid or has expired."));
  }
  let p = verifyEmailInFlight.get(key);
  if (!p) {
    const sp = new URLSearchParams({ token: key });
    p = apiRequest<{ ok: true; message: string }>(apiPath(`/api/auth/verify-email?${sp.toString()}`), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    }).finally(() => {
      verifyEmailInFlight.delete(key);
    });
    verifyEmailInFlight.set(key, p);
  }
  return p;
}

export async function oauthAPI(payload: {
  provider: "google";
  idToken: string;
  isLogin: boolean;
  intendedRole: "business" | "employee";
  name?: string;
  businessName?: string;
  businessType?: string;
  location?: string;
  inviteCode?: string;
}): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(apiPath("/api/auth/oauth"), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      provider: payload.provider,
      idToken: payload.idToken,
      isLogin: payload.isLogin,
      intendedRole: toBackendIntendedRole(payload.intendedRole),
      ...(payload.name ? { name: payload.name } : {}),
      ...(payload.businessName ? { businessName: payload.businessName } : {}),
      ...(payload.businessType ? { businessType: payload.businessType } : {}),
      ...(payload.location ? { location: payload.location } : {}),
      ...(payload.inviteCode ? { inviteCode: payload.inviteCode } : {}),
    }),
    credentials: "include",
  });
}

export async function refreshSessionAPI(): Promise<AuthResponse> {
  const r = await ensureRefreshedSession();
  if (r.ok) return r.data;
  if (r.status === 503) {
    throw new Error(SERVICE_UNAVAILABLE_CLIENT_MESSAGE);
  }
  if (r.status === 500) {
    const m = fallbackMessageForHttpStatus(500);
    logClientError("api.refreshSessionAPI", new Error(`HTTP ${r.status}`), { status: r.status });
    throw new Error(m ?? "Our servers hit a problem. Please try again in a few minutes.");
  }
  if (r.status === 401 || r.status === 403) {
    throw new Error(fallbackMessageForHttpStatus(401) ?? "Your session has expired. Please sign in again.");
  }
  if (r.status === 0) {
    throw new Error(fallbackMessageForHttpStatus(503) ?? SERVICE_UNAVAILABLE_CLIENT_MESSAGE);
  }
  const fallback = fallbackMessageForHttpStatus(r.status);
  throw new Error(fallback ?? "Your session has expired. Please sign in again.");
}

// Business
export async function generateInviteCode(): Promise<{ inviteCode: string; expiresAt: string }> {
  try {
    return await apiRequest(apiPath("/api/business/generate-invite"), {
      method: "POST",
      headers: getHeaders(),
      credentials: "include",
    });
  } catch (err) {
    logClientError("api.generateInviteCode", err);
    if (import.meta.env.DEV) {
      const expires = new Date();
      expires.setDate(expires.getDate() + 7);
      return {
        inviteCode: String(Math.floor(100000 + Math.random() * 900000)),
        expiresAt: expires.toISOString(),
      };
    }
    throw err;
  }
}

export interface BusinessDashboardStats {
  name?: string;
  slug?: string | null;
  verificationStatus?: "pending" | "verified";
  /** Selected period for totals and charts (matches query). */
  timeframe?: "week" | "month" | "year" | "all";
  totalTips?: number;
  tipCount?: number;
  employeeCount?: number;
  /** One row per bucket: week = Mon–Sun, month = day 1–N, year = Jan–Dec. Amounts match `totalTips` sum. */
  dailyTipDistribution?: Array<{ day: string; amount: number }>;
  employees?: Array<{
    id: string;
    name: string;
    jobTitle: string;
    slug?: string | null;
    avatar: string | null;
    phone?: string | null;
    tipsTotal: number;
    tipCount: number;
    rating: number | null;
    email?: string;
    /** Mirrors `User.email_verified`; used with activationStatus for roster display. */
    emailVerified?: boolean;
    /** True when `User.password_hash` is set or OAuth is linked — from DB only, never the hash. */
    passwordIsSet?: boolean;
    isActive?: boolean;
    /** Venue roster includes deactivated rows until deleted; activation is per-row in DB. */
    activationStatus?: "active" | "pending_activation" | "pending_verification";
    monthlyGoal?: number | null;
    locationId?: string | null;
    assignedTableIds?: string[];
  }>;
  /** Employee-created tip goals (read-only for managers). */
  employeeGoals?: Array<{
    employeeId: string;
    name: string;
    goalAmount: number;
    goalPeriod: GoalPeriod;
    startDate: string;
    currentAmount: number;
    percent: number;
    status: EmployeeGoalProgressStatus;
  }>;
}

/**
 * Dashboard stats for the authenticated business owner (business resolved from JWT, not URL).
 * Avoids 404 when `caretip_user.businessId` is stale vs the database.
 */
export async function getBusinessStats(
  timeframe?: "week" | "month" | "year" | "all"
): Promise<BusinessDashboardStats> {
  const sp = new URLSearchParams();
  if (timeframe) sp.set("timeframe", timeframe);
  const qs = sp.toString();
  return apiRequest<BusinessDashboardStats>(
    apiPath(`/api/business/me/stats${qs ? `?${qs}` : ""}`),
    {
      headers: getHeaders(),
    }
  );
}

/**
 * Downloads all tips for the authenticated business as CSV (server resolves business from JWT only).
 * Filename: CareTip_Transactions_YYYY-MM-DD.csv
 */
export async function downloadBusinessTransactionsExport(): Promise<void> {
  const token = getToken();
  const res = await fetch(apiPath("/api/transactions/export"), {
    method: "GET",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });

  if (!res.ok) {
    const ct = res.headers.get("content-type") ?? "";
    let errData: unknown = {};
    if (ct.includes("application/json")) {
      errData = await res.json().catch(() => ({}));
    } else {
      const text = await res.text().catch(() => "");
      errData = text.trim() ? { message: text.trim().slice(0, 300) } : {};
    }
    logClientError("api.downloadBusinessTransactionsExport", new Error(`HTTP ${res.status}`), {
      status: res.status,
      body: errData,
    });
    throw new Error("Export failed. Please try again.");
  }

  const blob = await res.blob();
  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `CareTip_Transactions_${dateStr}.csv`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface BusinessInfo {
  id: string;
  name: string;
  /** Public directory path: `/{slug}` */
  slug?: string | null;
  logo: string | null;
  location?: string | null;
  registeredAddress?: string | null;
  type?: string | null;
  contactPhone?: string | null;
  website?: string | null;
  employeeCount: number;
  verificationStatus?: "pending" | "verified" | "rejected";
}

export async function getBusinessById(businessId: string): Promise<BusinessInfo | null> {
  return apiRequest(apiPath(`/api/business/${businessId}`), { headers: getHeaders() });
}

/** Authenticated manager: returns only the business tied to the JWT (not arbitrary IDs). */
export async function fetchBusinessProfile(): Promise<BusinessInfo> {
  return apiRequest(apiPath("/api/business/profile"), { headers: getHeaders() });
}

export async function regenerateBusinessSlug(): Promise<{ slug: string }> {
  return apiRequest<{ slug: string }>(apiPath("/api/business/profile/slug/regenerate"), {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
  });
}

export async function validateInviteCode(code: string): Promise<{ ok: true; businessName?: string }> {
  const sp = new URLSearchParams({ code: String(code ?? "").trim() });
  return apiRequest<{ ok: true; businessName?: string }>(apiPath(`/api/business/invite/validate?${sp.toString()}`), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
}

export async function patchMyOnboardingStatus(hasCompletedOnboarding: boolean): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(apiPath("/api/auth/me"), {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ hasCompletedOnboarding }),
    credentials: "include",
  });
}

export async function patchBusinessProfile(body: {
  name?: string;
  legalBusinessName?: string;
  businessType?: string | null;
  location?: string | null;
  registeredAddress?: string | null;
  contactPhone?: string | null;
  website?: string | null;
}): Promise<BusinessInfo> {
  return apiRequest<BusinessInfo>(apiPath("/api/business/profile"), {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(body),
    credentials: "include",
  });
}

/** Same payload as PATCH — PUT for clients that expect REST “replace” semantics. */
export async function putBusinessProfile(body: {
  name?: string;
  businessType?: string | null;
  location?: string | null;
  registeredAddress?: string | null;
  contactPhone?: string | null;
  website?: string | null;
}): Promise<BusinessInfo> {
  return apiRequest<BusinessInfo>(apiPath("/api/business/profile"), {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(body),
    credentials: "include",
  });
}

export async function uploadMyBusinessLogo(file: File): Promise<{ success: boolean; path: string }> {
  const form = new FormData();
  form.append("file", file);
  return apiRequest(apiPath("/api/business/profile/logo"), {
    method: "POST",
    headers: getAuthHeadersOnly(),
    body: form,
    credentials: "include",
  });
}

// Employees
export interface EmployeeItem {
  id: string;
  slug: string | null;
  name: string;
  role: string;
  avatar: string | null;
  rating: number | null;
  tips: number;
  topRated: boolean;
}

export async function getEmployees(businessId: string): Promise<EmployeeItem[]> {
  return apiRequest(
    apiPath(`/api/employees?businessId=${encodeURIComponent(businessId)}`),
    { headers: getHeaders() }
  );
}

export async function regenerateEmployeeSlug(employeeId: string): Promise<{
  id: string;
  name: string;
  jobTitle: string;
  slug: string | null;
  avatar: string | null;
  email: string;
}> {
  return apiRequest(apiPath(`/api/employees/${encodeURIComponent(employeeId)}/regenerate-slug`), {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
  });
}

export interface EmployeeDetail {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  monthlyGoal: number | null;
  currentMonthTotal: number;
  businessId: string;
  businessSlug: string | null;
  /** API path or URL for venue logo on customer flows. */
  businessLogo?: string | null;
  businessName?: string;
  slug: string | null;
}

export async function getEmployeeById(employeeId: string): Promise<EmployeeDetail> {
  return apiRequest(apiPath(`/api/employees/${encodeURIComponent(employeeId)}`), {
    headers: getHeaders(),
  });
}

export interface StaffBySlugResponse {
  id: string;
  name: string;
  slug: string | null;
  avatar: string | null;
  jobTitle: string;
  bio: string | null;
  monthlyGoal: number | null;
  currentMonthTotal: number;
  businessId: string;
  businessName: string;
  businessSlug: string;
  businessLogo?: string | null;
}

export async function getStaffBySlug(slug: string): Promise<StaffBySlugResponse> {
  return apiRequest(apiPath(`/api/staff/${encodeURIComponent(slug)}`), { headers: getHeaders() });
}

export async function getStaffByBusinessEmployeeSlug(
  businessSlug: string,
  employeeSlug: string
): Promise<StaffBySlugResponse> {
  return apiRequest(
    apiPath(
      `/api/staff/directory/business/${encodeURIComponent(businessSlug)}/employee/${encodeURIComponent(employeeSlug)}`
    ),
    { headers: getHeaders() }
  );
}

export interface BusinessDirectoryEmployee {
  id: string;
  name: string;
  slug: string | null;
  jobTitle: string;
  avatar: string | null;
}

export interface BusinessDirectoryResponse {
  business: {
    id: string;
    name: string;
    slug: string | null;
    logo?: string | null;
    type?: string | null;
    location?: string | null;
  };
  employees: BusinessDirectoryEmployee[];
}

/** Public: active staff for business team QR (/business/:slug) */
export async function getBusinessStaffDirectory(
  businessSlug: string
): Promise<BusinessDirectoryResponse> {
  return apiRequest<BusinessDirectoryResponse>(
    apiPath(`/api/staff/directory/business/${encodeURIComponent(businessSlug)}`),
    { headers: getHeaders() }
  );
}

export async function createEmployee(payload: {
  name: string;
  role: string;
  email: string;
  phone?: string;
  locationId?: string | null;
  tableIds?: string[];
  /** When true: employee is created pending activation and receives activation email. */
  useActivationFlow?: boolean;
}): Promise<{
  id: string;
  name: string;
  jobTitle: string;
  temporaryPassword?: string;
  locationId?: string | null;
  assignedTableIds?: string[];
}> {
  return apiRequest(apiPath("/api/employees"), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
    credentials: "include",
  });
}

export async function updateEmployee(
  employeeId: string,
  payload: {
    name?: string;
    role?: string;
    jobTitle?: string;
    monthlyGoal?: number | null;
    isActive?: boolean;
    email?: string;
    locationId?: string | null;
    tableIds?: string[];
  }
): Promise<{
  id: string;
  name: string;
  jobTitle: string;
  slug: string | null;
  avatar: string | null;
  monthlyGoal: number | null;
  isActive: boolean;
  email: string;
  locationId?: string | null;
  assignedTableIds?: string[];
}> {
  return apiRequest(apiPath(`/api/employees/${encodeURIComponent(employeeId)}`), {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(payload),
    credentials: "include",
  });
}

export async function updateEmployeeStatus(
  employeeId: string,
  isActive: boolean
): Promise<{
  id: string;
  name: string;
  jobTitle: string;
  slug: string | null;
  avatar: string | null;
  monthlyGoal: number | null;
  isActive: boolean;
  email: string;
  locationId?: string | null;
  assignedTableIds?: string[];
}> {
  return apiRequest(apiPath(`/api/employees/${encodeURIComponent(employeeId)}/status`), {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ isActive }),
    credentials: "include",
  });
}

export async function deleteEmployee(employeeId: string): Promise<void> {
  await apiRequest<void>(apiPath(`/api/employees/${encodeURIComponent(employeeId)}`), {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });
}

// Tips
export interface TipItem {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
}

export type TipStatus = "success" | "pending" | "failed";

export type TipActivityRow = {
  id: string;
  amount: number;
  status: TipStatus | string;
  createdAt: string;
  employeeId: string;
  locationId: string | null;
  tableId: string | null;
  staffName: string | null;
  locationName: string | null;
  tableName: string | null;
};

export async function listBusinessTips(params: {
  take?: number;
  skip?: number;
  status?: TipStatus;
  /** Optional preset range handled by backend in business timezone */
  range?: "today" | "week" | "month" | "custom";
  /** Custom local dates (YYYY-MM-DD). Backend converts using business timezone. */
  fromDate?: string;
  toDate?: string;
  /** Legacy UTC instants (kept for backwards compatibility) */
  from?: string;
  to?: string;
  employeeId?: string;
  locationId?: string;
  tableId?: string;
}): Promise<{ timezone?: string; total: number; items: TipActivityRow[] }> {
  const sp = new URLSearchParams();
  if (params.take != null) sp.set("take", String(params.take));
  if (params.skip != null) sp.set("skip", String(params.skip));
  if (params.status) sp.set("status", params.status);
  if (params.range) sp.set("range", params.range);
  if (params.fromDate) sp.set("fromDate", params.fromDate);
  if (params.toDate) sp.set("toDate", params.toDate);
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  if (params.employeeId) sp.set("employeeId", params.employeeId);
  if (params.locationId) sp.set("locationId", params.locationId);
  if (params.tableId) sp.set("tableId", params.tableId);
  const qs = sp.toString();
  return apiRequest(apiPath(`/api/tips/business${qs ? `?${qs}` : ""}`), { headers: getHeaders(), credentials: "include" });
}

export async function listEmployeeTips(params: {
  take?: number;
  skip?: number;
  status?: TipStatus;
  /** Optional preset range handled by backend in business timezone */
  range?: "today" | "week" | "month" | "custom";
  /** Custom local dates (YYYY-MM-DD). Backend converts using business timezone. */
  fromDate?: string;
  toDate?: string;
  /** Legacy UTC instants (kept for backwards compatibility) */
  from?: string;
  to?: string;
}): Promise<{ timezone?: string; total: number; items: TipActivityRow[] }> {
  const sp = new URLSearchParams();
  if (params.take != null) sp.set("take", String(params.take));
  if (params.skip != null) sp.set("skip", String(params.skip));
  if (params.status) sp.set("status", params.status);
  if (params.range) sp.set("range", params.range);
  if (params.fromDate) sp.set("fromDate", params.fromDate);
  if (params.toDate) sp.set("toDate", params.toDate);
  if (params.from) sp.set("from", params.from);
  if (params.to) sp.set("to", params.to);
  const qs = sp.toString();
  return apiRequest(apiPath(`/api/tips/employee/list${qs ? `?${qs}` : ""}`), { headers: getHeaders(), credentials: "include" });
}

export type GoalPeriod = "daily" | "weekly" | "monthly";

export type EmployeeGoalProgressStatus = "achieved" | "on_track" | "below_target";

export interface EmployeeGoalProgress {
  id: string;
  employeeId: string;
  name?: string;
  lifecycleStatus?: "active" | "archived";
  goalAmount: number;
  goalPeriod: GoalPeriod;
  startDate: string;
  currentAmount: number;
  percent: number;
  status: EmployeeGoalProgressStatus;
}

export interface EmployeeTipsResponse {
  tips: TipItem[];
  monthlyGoal: number | null;
  currentMonthTotal: number;
  goal: EmployeeGoalProgress | null;
  businessTimezone?: string;
  /** Server aggregate for selected period — matches `tips` and `chartSeries` */
  periodAmountEur?: number;
  periodTipCount?: number;
  chartSeries?: Array<{ label: string; amount: number }>;
}

export type EmployeeGoalStatus = "active" | "archived";

export type EmployeeGoalRow = {
  id: string;
  name: string;
  goalAmount: number;
  goalPeriod: GoalPeriod;
  status: EmployeeGoalStatus;
  startDate: string;
  createdAt: string;
  updatedAt: string;
};

export async function listMyGoals(): Promise<{ goals: EmployeeGoalRow[] }> {
  return apiRequest(apiPath("/api/goals"), { headers: getHeaders(), credentials: "include" });
}

export async function createMyGoal(payload: {
  name: string;
  goalAmount: number;
  goalPeriod: GoalPeriod;
  startDate: string;
}): Promise<{ goal: EmployeeGoalRow }> {
  return apiRequest(apiPath("/api/goals"), {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
}

export async function updateMyGoal(
  goalId: string,
  payload: Partial<{ name: string; goalAmount: number; goalPeriod: GoalPeriod; startDate: string }>
): Promise<{ goal: EmployeeGoalRow }> {
  return apiRequest(apiPath(`/api/goals/${encodeURIComponent(goalId)}`), {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
}

export async function archiveMyGoal(goalId: string): Promise<{ goal: EmployeeGoalRow }> {
  return apiRequest(apiPath(`/api/goals/${encodeURIComponent(goalId)}/archive`), {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
  });
}

export async function deleteMyGoalById(goalId: string): Promise<void> {
  await apiRequest<void>(apiPath(`/api/goals/${encodeURIComponent(goalId)}`), {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });
}

export async function getEmployeeGoal(): Promise<{ goal: EmployeeGoalProgress | null }> {
  return apiRequest(apiPath("/api/employees/me/goal"), { headers: getHeaders(), credentials: "include" });
}

export async function upsertEmployeeGoal(payload: {
  goalAmount: number;
  goalPeriod: GoalPeriod;
  startDate: string;
}): Promise<{ goal: EmployeeGoalProgress }> {
  return apiRequest(apiPath("/api/employees/me/goal"), {
    method: "PUT",
    headers: getHeaders(),
    credentials: "include",
    body: JSON.stringify(payload),
  });
}

export async function deleteEmployeeGoal(): Promise<void> {
  await apiRequest<void>(apiPath("/api/employees/me/goal"), {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });
}

export async function getTipsByEmployee(
  timeframe?: "today" | "week" | "month",
  init?: Pick<RequestInit, "signal">,
): Promise<EmployeeTipsResponse> {
  const qs = timeframe ? `?timeframe=${encodeURIComponent(timeframe)}` : "";
  return apiRequest(apiPath(`/api/tips/employee${qs}`), { headers: getHeaders(), ...(init ?? {}) });
}

export interface EmployeeSelfProfile {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  bio: string | null;
  avatar: string | null;
  phone?: string | null;
  monthlyGoal: number | null;
  emailNotifications: boolean;
  pushNotifications: boolean;
  businessId: string;
  /** Public `Business.slug` for `/{businessSlug}/{employeeSlug}` URLs */
  businessSlug: string | null;
  /** Public /staff/[slug] segment */
  slug: string | null;
  /** Business IANA timezone for analytics reporting. */
  businessTimezone?: string;
}

export async function getEmployeeProfile(): Promise<EmployeeSelfProfile> {
  return apiRequest(apiPath("/api/employees/me"), { headers: getHeaders(), credentials: "include" });
}

/** Ensures a unique staff slug exists (for QR / public page). Safe to call when slug already set. */
export async function ensureEmployeeSlug(): Promise<EmployeeSelfProfile> {
  return apiRequest(apiPath("/api/employees/me/ensure-slug"), {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
  });
}

export async function patchEmployeeProfile(payload: {
  name?: string;
  bio?: string | null;
  phone?: string | null;
  monthlyGoal?: number | null;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
}): Promise<EmployeeSelfProfile> {
  return apiRequest(apiPath("/api/employees/me"), {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(payload),
    credentials: "include",
  });
}

export async function uploadEmployeeAvatar(file: File): Promise<{ avatar: string }> {
  const token = getToken();
  const fd = new FormData();
  fd.append("avatar", file);
  const res = await fetch(apiPath("/api/employees/me/avatar"), {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
    credentials: "include",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    logClientError("api.uploadEmployeeAvatar", new Error(`HTTP ${res.status}`), { body: data });
    const raw = (data as { message?: string }).message ?? res.statusText ?? "Upload failed";
    throw new Error(toUserFriendlyMessage(new Error(raw)));
  }
  return data as { avatar: string };
}

export async function changePasswordAPI(currentPassword: string, newPassword: string): Promise<void> {
  await apiRequest(apiPath("/api/auth/change-password"), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ currentPassword, newPassword }),
    credentials: "include",
  });
}

export type MyAccountSettings = {
  tipReceivedNotifications: boolean;
  summaryEmails: boolean;
  systemAlerts: boolean;
  notifyNewLogin: boolean;
};

export async function getMyAccountSettings(): Promise<MyAccountSettings> {
  return apiRequest(apiPath("/api/me/settings"), {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });
}

export async function patchMyAccountSettings(
  payload: Partial<MyAccountSettings>,
): Promise<MyAccountSettings> {
  return apiRequest(apiPath("/api/me/settings"), {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(payload),
    credentials: "include",
  });
}

export async function getTwoFactorStatus(): Promise<{ enabled: boolean }> {
  return apiRequest(apiPath("/api/auth/2fa/status"), {
    method: "GET",
    headers: getHeaders(),
    credentials: "include",
  });
}

export async function setupTwoFactor(): Promise<{ otpauthUrl: string; qrDataUrl: string }> {
  return apiRequest(apiPath("/api/auth/2fa/setup"), {
    method: "POST",
    headers: getHeaders(),
    credentials: "include",
  });
}

export async function enableTwoFactor(code: string): Promise<{ enabled: boolean }> {
  return apiRequest(apiPath("/api/auth/2fa/enable"), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ code }),
    credentials: "include",
  });
}

export async function disableTwoFactor(code: string): Promise<{ enabled: boolean }> {
  return apiRequest(apiPath("/api/auth/2fa/disable"), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ code }),
    credentials: "include",
  });
}

export async function downloadMyDataExport(): Promise<void> {
  const token = getToken();
  const res = await fetch(apiPath("/api/employees/me/export"), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    credentials: "include",
  });
  if (!res.ok) {
    const ct = res.headers.get("content-type") ?? "";
    let errData: unknown = {};
    if (ct.includes("application/json")) {
      errData = await res.json().catch(() => ({}));
    } else {
      const text = await res.text().catch(() => "");
      errData = text.trim() ? { message: text.trim().slice(0, 300) } : {};
    }
    logClientError("api.downloadMyDataExport", new Error(`HTTP ${res.status}`), {
      status: res.status,
      body: errData,
    });
    throw new Error(toUserFriendlyMessage(new Error("Could not download your data.")));
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `caretip-my-data-${new Date().toISOString().slice(0, 10)}.json`;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function deleteMyEmployeeAccount(): Promise<void> {
  await apiRequest<void>(apiPath("/api/employees/me"), {
    method: "DELETE",
    headers: getHeaders(),
    credentials: "include",
  });
}

export interface TippingContextResponse {
  locationName: string;
  tableName: string;
  businessId: string;
  locationId: string;
  tableId: string;
  businessName: string;
  businessLogo?: string | null;
}

/** Public: resolve table QR slug to venue + business (guest scan). */
export async function getTippingContextByQrSlug(qrSlug: string): Promise<TippingContextResponse> {
  return apiRequest<TippingContextResponse>(
    apiPath(`/api/tipping-context/${encodeURIComponent(qrSlug)}`),
    { method: "GET" }
  );
}

/** Public: venue/location QR — team list for the business at this location. */
export interface PublicLocationContextResponse {
  business: { id: string; name: string; slug: string | null; logo?: string | null };
  location: { id: string; name: string; description: string | null };
  employees: BusinessDirectoryEmployee[];
}

export async function getPublicLocationContext(
  locationId: string
): Promise<PublicLocationContextResponse> {
  return apiRequest<PublicLocationContextResponse>(
    apiPath(`/api/tipping-context/location/${encodeURIComponent(locationId)}`),
    { method: "GET" }
  );
}

/** Public: table QR by table id — same team list + table/location labels for tip metadata. */
export interface PublicTableContextResponse {
  business: { id: string; name: string; slug: string | null; logo?: string | null };
  location: { id: string; name: string };
  table: { id: string; name: string; qrSlug: string };
  employees: BusinessDirectoryEmployee[];
}

export async function getPublicTableContextById(
  tableId: string
): Promise<PublicTableContextResponse> {
  return apiRequest<PublicTableContextResponse>(
    apiPath(`/api/tipping-context/table/${encodeURIComponent(tableId)}`),
    { method: "GET" }
  );
}

export interface LocationDTO {
  id: string;
  name: string;
  description: string | null;
  businessId: string;
}

export async function fetchLocations(): Promise<LocationDTO[]> {
  return apiRequest<LocationDTO[]>(apiPath("/api/locations"), {
    headers: getHeaders(),
    credentials: "include",
  });
}

export async function createLocationAPI(payload: {
  name: string;
  description?: string;
}): Promise<LocationDTO> {
  return apiRequest<LocationDTO>(apiPath("/api/locations"), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
    credentials: "include",
  });
}

export interface TableDTO {
  id: string;
  name: string;
  qrSlug: string;
  locationId: string;
  location: { id: string; name: string };
}

export async function fetchTables(): Promise<TableDTO[]> {
  return apiRequest<TableDTO[]>(apiPath("/api/tables"), {
    headers: getHeaders(),
    credentials: "include",
  });
}

export async function createTableAPI(payload: {
  name: string;
  locationId: string;
  qrSlug?: string;
}): Promise<{ id: string; name: string; qrSlug: string; locationId: string }> {
  return apiRequest(apiPath("/api/tables"), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(payload),
    credentials: "include",
  });
}

export async function createPaymentIntent(params: {
  amount: number;
  employeeId: string;
  businessId: string;
  locationId?: string | null;
  tableId?: string | null;
}): Promise<{ clientSecret: string; paymentIntentId: string }> {
  return apiRequest(apiPath("/api/tips/create-intent"), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(params),
  });
}

/** Guest checkout — Stripe-hosted page (Apple Pay / Google Pay / card where available). */
export async function createTipCheckoutSession(params: {
  amount: number;
  employeeId: string;
  businessId: string;
  tipAmount?: number;
  locationId?: string | null;
  tableId?: string | null;
  customerName?: string | null;
  feedback?: string | null;
}): Promise<{ sessionId: string; url: string | null }> {
  return apiRequest(apiPath("/api/payments/create-tip-session"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export type TipSessionContextResponse =
  | {
      status: "pending";
      sessionId: string;
      paymentIntentId: string | null;
      transactionId?: undefined;
      employee: { id: string; name: string; avatar: string | null } | null;
      businessId: string | null;
      locationId: string | null;
      tableId: string | null;
      customerName: string | null;
    }
  | {
      status: "ready";
      sessionId: string;
      paymentIntentId: string | null;
      transactionId: string;
      employee: { id: string; name: string; avatar: string | null } | null;
      businessId: string;
      locationId: string | null;
      tableId: string | null;
      customerName: string | null;
    };

export async function getTipSessionContext(sessionId: string): Promise<TipSessionContextResponse> {
  return apiRequest(apiPath(`/api/payments/tip-session/${encodeURIComponent(sessionId)}`), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
}

export async function submitTipFeedback(payload: {
  sessionId: string;
  rating?: number | null;
  comment?: string | null;
  tags?: string[];
  customerName?: string | null;
}): Promise<{ ok: true; feedbackId: string; transactionId: string }> {
  return apiRequest(apiPath("/api/feedback/tip"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

// --- Platform admin (SuperAdmin) ---

export interface PlatformHealthResponse {
  database: "online" | "offline";
  stripe: "online" | "offline";
}

export async function fetchPlatformHealth(): Promise<PlatformHealthResponse> {
  return apiRequest<PlatformHealthResponse>(apiPath("/api/platform/health"), {
    headers: getHeaders(),
    credentials: "include",
  });
}

export interface PlatformGlobalStats {
  totalVolumeEur: number;
  totalVolumeEurFormatted: string;
  transactionCount: number;
  successTransactionCount: number;
  businessesCount: number;
  employeesCount: number;
  locationsCount: number;
  activeUsersCount: number;
  /** Distinct businesses with at least one successful tip */
  businessesWithSuccessfulTips?: number;
  /** Sum of successful tips when grouped by businessId (sanity-check vs totalVolumeEur) */
  platformTotalTipsFromBusinessRollupEur?: number;
  platformTotalsConsistent?: boolean;
}

export async function fetchPlatformStats(): Promise<PlatformGlobalStats> {
  return apiRequest<PlatformGlobalStats>(apiPath("/api/platform/stats"), {
    headers: getHeaders(),
    credentials: "include",
  });
}

export type PlatformAnalytics = {
  timezone?: string;
  rangeDays: number;
  userDistribution: Array<{ role: "business" | "employee" | "platform_admin"; count: number }>;
  tipStatus: Array<{ status: "success" | "pending" | "failed"; count: number }>;
  growth: Array<{ date: string; newUsers: number; newBusinesses: number; newTips: number }>;
  tipVolume: Array<{ date: string; tipsEur: number; tipCount: number }>;
  topBusinessesByTips: Array<{ businessId: string; businessName: string; tipsEur: number }>;
};

export async function fetchPlatformAnalytics(days = 30, timezone?: string): Promise<PlatformAnalytics> {
  const sp = new URLSearchParams();
  sp.set("days", String(days));
  if (timezone) sp.set("timezone", timezone);
  // Optional: analytics timezone for day-bucketing on backend.
  // When omitted, backend uses its safe default (Europe/Berlin).
  // We keep this param optional for backward compatibility.
  return apiRequest<PlatformAnalytics>(apiPath(`/api/platform/analytics?${sp.toString()}`), {
    headers: getHeaders(),
    credentials: "include",
  });
}

export interface GlobalTransactionRow {
  id: string;
  amountEur: number;
  caretipFeePercent: number;
  caretipFeeEur: number;
  netToStaffEur: number;
  payoutStatus: string;
  tipStatus: string;
  stripePaymentIntentId: string | null;
  createdAt: string;
  businessId: string;
  businessName: string;
  employeeName: string;
}

export async function fetchPlatformTransactions(params: {
  q?: string;
  take?: number;
  skip?: number;
}): Promise<{ items: GlobalTransactionRow[]; total: number }> {
  const sp = new URLSearchParams();
  if (params.q) sp.set("q", params.q);
  if (params.take != null) sp.set("take", String(params.take));
  if (params.skip != null) sp.set("skip", String(params.skip));
  const qs = sp.toString();
  return apiRequest(
    apiPath(`/api/platform/transactions${qs ? `?${qs}` : ""}`),
    { headers: getHeaders(), credentials: "include" }
  );
}

export interface PlatformBusinessRow {
  id: string;
  name: string;
  slug: string;
  verificationStatus: "pending" | "verified" | "rejected";
  legalContactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  website?: string | null;
  registeredAddress: string | null;
  ownerUserId: string;
  ownerEmail: string;
  staffCount?: number;
  locationCount?: number;
  /** Sum of successful tip amounts (EUR) for this business */
  totalTipsEur?: number;
  /** Count of successful tips for this business */
  successTipCount?: number;
  logoPath?: string | null;
  verificationDocumentPath?: string | null;
}

export async function fetchPlatformBusinesses(): Promise<{ businesses: PlatformBusinessRow[] }> {
  return apiRequest(apiPath("/api/platform/businesses"), {
    headers: getHeaders(),
    credentials: "include",
  });
}

export type PlatformVerificationAction = "verified" | "rejected" | "pending";

export async function updatePlatformBusinessVerificationStatus(
  businessId: string,
  status: PlatformVerificationAction
): Promise<void> {
  await apiRequest(apiPath(`/api/platform/businesses/${encodeURIComponent(businessId)}/verify`), {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ status }),
    credentials: "include",
  });
}

/** Approve business KYC (verified). */
export async function verifyPlatformBusiness(businessId: string): Promise<void> {
  await updatePlatformBusinessVerificationStatus(businessId, "verified");
}

export async function fetchPlatformBusiness(
  businessId: string
): Promise<{ business: PlatformBusinessRow }> {
  return apiRequest(apiPath(`/api/platform/businesses/${encodeURIComponent(businessId)}`), {
    headers: getHeaders(),
    credentials: "include",
  });
}

export interface PlatformAuditLogRow {
  id: string;
  action: string;
  userId: string;
  userEmail: string;
  metadata: string | null;
  createdAt: string;
}

export async function fetchPlatformAuditLogs(params: {
  take?: number;
  skip?: number;
}): Promise<{ items: PlatformAuditLogRow[]; total: number }> {
  const sp = new URLSearchParams();
  if (params.take != null) sp.set("take", String(params.take));
  if (params.skip != null) sp.set("skip", String(params.skip));
  const qs = sp.toString();
  return apiRequest(apiPath(`/api/platform/audit-logs${qs ? `?${qs}` : ""}`), {
    headers: getHeaders(),
    credentials: "include",
  });
}

export async function updatePlatformBusinessKyc(
  businessId: string,
  body: {
    legalContactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    website?: string | null;
    registeredAddress?: string | null;
  }
): Promise<{ success: boolean; business: PlatformBusinessRow }> {
  return apiRequest(apiPath(`/api/platform/businesses/${encodeURIComponent(businessId)}`), {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(body),
    credentials: "include",
  });
}

export async function uploadPlatformBusinessLogo(
  businessId: string,
  file: File
): Promise<{ success: boolean; path: string }> {
  const form = new FormData();
  form.append("file", file);
  return apiRequest(apiPath(`/api/platform/businesses/${encodeURIComponent(businessId)}/logo`), {
    method: "POST",
    headers: getAuthHeadersOnly(),
    body: form,
    credentials: "include",
  });
}

export async function uploadPlatformBusinessVerification(
  businessId: string,
  file: File
): Promise<{ success: boolean; path: string }> {
  const form = new FormData();
  form.append("file", file);
  return apiRequest(
    apiPath(`/api/platform/businesses/${encodeURIComponent(businessId)}/verification-document`),
    {
      method: "POST",
      headers: getAuthHeadersOnly(),
      body: form,
      credentials: "include",
    }
  );
}

export async function impersonateManagerAPI(businessId: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>(apiPath("/api/platform/impersonate"), {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ businessId }),
    credentials: "include",
  });
}
