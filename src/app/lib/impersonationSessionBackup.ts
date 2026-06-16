/**
 * In-memory backup of platform-admin session during impersonation.
 * Access tokens are never written to sessionStorage/localStorage.
 */

import type { User } from "../hooks/useAuth";

let adminTokenBackup: string | null = null;
let adminUserBackup: User | null = null;

export function saveImpersonationAdminBackup(token: string, user: User): void {
  adminTokenBackup = token.trim();
  adminUserBackup = user;
}

export function takeImpersonationAdminBackup(): { token: string; user: User } | null {
  const token = adminTokenBackup?.trim();
  const user = adminUserBackup;
  if (!token || !user) return null;
  adminTokenBackup = null;
  adminUserBackup = null;
  return { token, user };
}

export function clearImpersonationAdminBackup(): void {
  adminTokenBackup = null;
  adminUserBackup = null;
}

export function hasImpersonationAdminBackup(): boolean {
  return Boolean(adminTokenBackup?.trim() && adminUserBackup);
}
