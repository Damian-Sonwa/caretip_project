/**
 * In-memory access JWT store — never persisted to browser storage.
 * Session continuity relies on HttpOnly refresh cookie + POST /api/auth/refresh.
 */

import { notifyAuthStorageSync } from "./authStorageSync";

const LEGACY_TOKEN_KEY = "caretip_token";

type Listener = () => void;
const listeners = new Set<Listener>();

let memoryAccessToken: string | null = null;

export function getMemoryAccessToken(): string | null {
  const t = memoryAccessToken;
  return typeof t === "string" && t.trim() ? t.trim() : null;
}

export function setMemoryAccessToken(token: string | null): void {
  const prev = getMemoryAccessToken();
  if (token && token.trim()) {
    memoryAccessToken = token.trim();
  } else {
    memoryAccessToken = null;
  }
  const next = getMemoryAccessToken();
  if (next !== prev) {
    listeners.forEach((l) => l());
    notifyAuthStorageSync();
  }
}

export function clearMemoryAccessToken(): void {
  setMemoryAccessToken(null);
}

export function subscribeMemoryAccessToken(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Remove legacy localStorage JWT from prior builds (one-time per tab load). */
export function migrateLegacyAccessTokenFromStorage(): void {
  try {
    if (typeof localStorage === "undefined") return;
    const legacy = localStorage.getItem(LEGACY_TOKEN_KEY);
    if (legacy?.trim() && !getMemoryAccessToken()) {
      setMemoryAccessToken(legacy.trim());
    }
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  } catch {
    // ignore
  }
}
