/** Dispatched when access token or user is persisted in-tab (same-tab refresh does not fire `storage`). */
export const AUTH_STORAGE_SYNC_EVENT = "caretip-auth-storage-sync";

export function notifyAuthStorageSync(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(AUTH_STORAGE_SYNC_EVENT));
}
