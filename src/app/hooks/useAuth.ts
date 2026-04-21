import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { registerAPI, loginAPI, oauthAPI, logoutAPI, type AuthResponse } from "../lib/api";
import { logClientError } from "../lib/clientLog";

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
  const base: User = {
    id: data.id,
    name: data.name,
    email: data.email,
    role,
    emailVerified,
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

export function useAuth() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("caretip_user");
      if (saved) {
        return JSON.parse(saved) as User;
      }
    } catch (err) {
      logClientError("useAuth.localStorage", err);
    }
    return null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("caretip_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("caretip_user");
      localStorage.removeItem("caretip_token");
    }
  }, [user]);

  const login = async (
    email: string,
    password: string,
    intendedRole: "business" | "employee" | "platform_admin"
  ): Promise<User> => {
    const data = await loginAPI(email, password, intendedRole);
    localStorage.setItem("caretip_token", data.token);
    const u = parseUser(data.user);
    setUser(u);
    return u;
  };

  const register = async (payload: RegisterPayload): Promise<User> => {
    const data = await registerAPI(payload);
    localStorage.setItem("caretip_token", data.token);
    const u = parseUser(data.user);
    setUser(u);
    return u;
  };

  const loginWithOAuth = async (
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
    localStorage.setItem("caretip_token", data.token);
    const u = parseUser(data.user);
    setUser(u);
    return u;
  };

  const logout = () => {
    void logoutAPI();
    setUser(null);
    localStorage.removeItem("caretip_user");
    localStorage.removeItem("caretip_token");
    sessionStorage.removeItem("caretip_admin_token_backup");
    sessionStorage.removeItem("caretip_admin_user_backup");
  };

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
    setUser(JSON.parse(backupUser) as User);
    sessionStorage.removeItem("caretip_admin_token_backup");
    sessionStorage.removeItem("caretip_admin_user_backup");
    navigate("/platform-admin/dashboard");
  }, [navigate]);

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((u) => (u ? { ...u, ...patch } : null));
  }, []);

  const replaceUser = useCallback((next: User) => {
    setUser(next);
  }, []);

  return {
    user,
    isBusiness,
    isEmployee,
    isPlatformAdmin,
    login,
    register,
    loginWithOAuth,
    logout,
    switchRole,
    updateUser,
    replaceUser,
    exitImpersonation,
  };
}
