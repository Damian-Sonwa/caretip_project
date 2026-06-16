/**
 * Platform-admin session backup while impersonating a business manager.
 * Memory holds the active backup; sessionStorage survives accidental reloads.
 * Access tokens are never written to localStorage.
 */

import type { User } from "../hooks/useAuth";
import { normalizeStoredUser } from "./authUserNormalize";

const BACKUP_STORAGE_KEY = "caretip_impersonation_admin_backup";

type BackupPayload = {
  token: string;
  user: User;
};

let adminTokenBackup: string | null = null;
let adminUserBackup: User | null = null;

function readSessionStorageBackup(): BackupPayload | null {
  try {
    const raw = sessionStorage.getItem(BACKUP_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: unknown; user?: unknown };
    const token = typeof parsed.token === "string" ? parsed.token.trim() : "";
    const user = parsed.user ? normalizeStoredUser(parsed.user) : null;
    if (!token || !user) return null;
    return { token, user };
  } catch {
    return null;
  }
}

function writeSessionStorageBackup(payload: BackupPayload): void {
  try {
    sessionStorage.setItem(
      BACKUP_STORAGE_KEY,
      JSON.stringify({ token: payload.token, user: payload.user }),
    );
  } catch {
    // ignore quota / private mode
  }
}

function clearSessionStorageBackup(): void {
  try {
    sessionStorage.removeItem(BACKUP_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function saveImpersonationAdminBackup(token: string, user: User): void {
  const trimmed = token.trim();
  adminTokenBackup = trimmed;
  adminUserBackup = user;
  writeSessionStorageBackup({ token: trimmed, user });
}

export function peekImpersonationAdminBackup(): BackupPayload | null {
  if (adminTokenBackup?.trim() && adminUserBackup) {
    return { token: adminTokenBackup.trim(), user: adminUserBackup };
  }
  return readSessionStorageBackup();
}

export function takeImpersonationAdminBackup(): BackupPayload | null {
  const fromMemory =
    adminTokenBackup?.trim() && adminUserBackup
      ? { token: adminTokenBackup.trim(), user: adminUserBackup }
      : null;
  const backup = fromMemory ?? readSessionStorageBackup();
  adminTokenBackup = null;
  adminUserBackup = null;
  clearSessionStorageBackup();
  return backup;
}

export function clearImpersonationAdminBackup(): void {
  adminTokenBackup = null;
  adminUserBackup = null;
  clearSessionStorageBackup();
}

export function hasImpersonationAdminBackup(): boolean {
  return Boolean(peekImpersonationAdminBackup());
}
