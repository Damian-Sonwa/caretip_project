/**
 * Single in-memory user snapshot shared by every `useAuth()` caller.
 * Without this, login updates one hook instance while route guards read another (blink + /login bounce).
 */

import { flushSync } from "react-dom";
import type { User } from "../hooks/useAuth";

const USER_STORAGE_KEY = "caretip_user";

type Listener = () => void;
const listeners = new Set<Listener>();

function readInitialUser(): User | null {
  try {
    const saved = localStorage.getItem(USER_STORAGE_KEY);
    if (!saved) return null;
    return JSON.parse(saved) as User;
  } catch {
    return null;
  }
}

let currentUser: User | null = readInitialUser();

export function getAuthUser(): User | null {
  return currentUser;
}

/** Update all subscribers (async batch — use for storage-sync events). */
export function setAuthUser(next: User | null): void {
  currentUser = next;
  listeners.forEach((l) => l());
}

/**
 * Commit user + force subscribed hooks to render before navigation / route guards run.
 */
export function commitAuthUser(next: User | null): void {
  currentUser = next;
  flushSync(() => {
    listeners.forEach((l) => l());
  });
}

export function subscribeAuthUser(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const ACCESS_TOKEN_STORAGE_KEY = "caretip_token";

/** True when local storage still holds credentials (guard grace while hooks sync). */
export function hasClientStoredSession(): boolean {
  try {
    const token = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
    const user = localStorage.getItem(USER_STORAGE_KEY);
    return Boolean(token?.trim()) || Boolean(user);
  } catch {
    return false;
  }
}
