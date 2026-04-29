/**
 * API client for Caretip backend.
 * Base URL: VITE_API_URL (e.g. http://localhost:3001)
 * All errors are translated to user-friendly messages before being thrown.
 */

import { toUserFriendlyMessage, fallbackMessageForHttpStatus } from "./errorMessages";
import { ApiRequestError, EMAIL_NOT_VERIFIED_CODE } from "./apiError";
import { resolveApiBaseUrl } from "./apiOrigin";
import { logClientError } from "./clientLog";

let refreshInFlight: Promise<string | null> | null = null;

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

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(apiPath("/api/auth/refresh"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        });
        if (!res.ok) return null;
        const data = (await res.json().catch(() => null)) as unknown;
        const token =
          data && typeof data === "object" && typeof (data as any).token === "string"
            ? String((data as any).token)
            : null;
        if (token) setToken(token);
        return token;
      } catch (err) {
        logClientError("api.refreshAccessToken", err);
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

function withUpdatedBearer(init: RequestInit | undefined, token: string): RequestInit {
  const next: RequestInit = { ...(init ?? {}) };
  const headers: Record<string, string> = {};
  const h = next.headers as HeadersInit | undefined;
  if (h) {
    if (h instanceof Headers) {
      h.forEach((v, k) => (headers[k] = v));
    } else if (Array.isArray(h)) {
      for (const [k, v] of h) headers[k] = v;
    } else {
      Object.assign(headers, h as Record<string, string>);
    }
  }
  headers["Authorization"] = `Bearer ${token}`;
  next.headers = headers;
  return next;
}

/** Wraps fetch + handleRes and translates network/API errors to user-friendly messages */
async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    logClientError("api.apiRequest", err, { url });
    const baseMsg = toUserFriendlyMessage(err);
    throw new Error(baseMsg + apiConfigHintForFailedFetch(url));
  }

  if (res.status === 401) {
    const token = getToken();
    const canAttempt =
      typeof token === "string" &&
      token.trim().length > 0 &&
      (url.startsWith("/api/") || url.startsWith("/uploads/"));
    const alreadyRetried = (init as { __caretipRetried?: boolean } | undefined)?.__caretipRetried === true;
    if (canAttempt && !alreadyRetried) {
      const nextToken = await refreshAccessToken();
      if (nextToken) {
        const retriedInit = { ...(withUpdatedBearer(init, nextToken) as any), __caretipRetried: true };
        res = await fetch(url, retriedInit);
      } else {
        setToken(null);
      }
    }
  }

  return handleRes<T>(res);
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
  businessName?: string;
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

export async function verifyEmailWithToken(token: string): Promise<{ ok: true; message: string }> {
  const sp = new URLSearchParams({ token });
  return apiRequest<{ ok: true; message: string }>(apiPath(`/api/auth/verify-email?${sp.toString()}`), {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
}

export async function oauthAPI(payload: {
  provider: "google";
  idToken: string;
  isLogin: boolean;
  intendedRole: "business" | "employee";
  name?: string;
  businessName?: string;
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
      ...(payload.inviteCode ? { inviteCode: payload.inviteCode } : {}),
    }),
    credentials: "include",
  });
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
  /** Public directory path: /business/{slug} */
  slug?: string | null;
  logo: string | null;
  location?: string;
  type?: string;
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
}

export async function getStaffBySlug(slug: string): Promise<StaffBySlugResponse> {
  return apiRequest(apiPath(`/api/staff/${encodeURIComponent(slug)}`), { headers: getHeaders() });
}

export interface BusinessDirectoryEmployee {
  id: string;
  name: string;
  slug: string | null;
  jobTitle: string;
  avatar: string | null;
}

export interface BusinessDirectoryResponse {
  business: { id: string; name: string; slug: string | null };
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

export type GoalPeriod = "daily" | "weekly" | "monthly";

export type EmployeeGoalProgressStatus = "achieved" | "on_track" | "below_target";

export interface EmployeeGoalProgress {
  id: string;
  employeeId: string;
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

export async function getTipsByEmployee(): Promise<EmployeeTipsResponse> {
  return apiRequest(apiPath("/api/tips/employee"), { headers: getHeaders() });
}

export interface EmployeeSelfProfile {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  bio: string | null;
  avatar: string | null;
  monthlyGoal: number | null;
  emailNotifications: boolean;
  pushNotifications: boolean;
  businessId: string;
  /** Public /staff/[slug] segment */
  slug: string | null;
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
  business: { id: string; name: string; slug: string | null };
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
  business: { id: string; name: string; slug: string | null };
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
