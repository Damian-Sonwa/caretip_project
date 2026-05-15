/**
 * Employee tip-notification unread state (shared across dashboard header, layout, notifications page).
 * Tips act as notifications; read IDs persist per employee in localStorage.
 */

import type { TipItem } from "./api";

const STORAGE_PREFIX = "caretip_employee_read_tips_";

type Listener = () => void;
const listeners = new Set<Listener>();

let employeeId: string | null = null;
let readIds = new Set<string>();
let knownTipIds: string[] = [];
let unreadCount = 0;

function notify() {
  listeners.forEach((l) => l());
}

function storageKey(empId: string): string {
  return `${STORAGE_PREFIX}${empId}`;
}

function loadReadIds(empId: string): void {
  try {
    const raw = localStorage.getItem(storageKey(empId));
    readIds = raw ? new Set(JSON.parse(raw) as string[]) : new Set();
  } catch {
    readIds = new Set();
  }
}

function persistReadIds(): void {
  if (!employeeId) return;
  try {
    localStorage.setItem(storageKey(employeeId), JSON.stringify([...readIds]));
  } catch {
    // ignore quota / private mode
  }
}

function recomputeUnread(): void {
  unreadCount = knownTipIds.filter((id) => !readIds.has(id)).length;
}

export function getEmployeeUnreadCount(): number {
  return unreadCount;
}

export function getEmployeeReadIdsRecord(): Record<string, true> {
  const out: Record<string, true> = {};
  for (const id of readIds) out[id] = true;
  return out;
}

export function subscribeEmployeeNotifications(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Bind store to an employee and sync tip list from API (layout bootstrap / notifications page). */
export function syncEmployeeNotificationTips(empId: string, tips: TipItem[]): void {
  if (employeeId !== empId) {
    employeeId = empId;
    loadReadIds(empId);
  }
  knownTipIds = tips.map((t) => t.id);
  recomputeUnread();
  notify();
}

/** Realtime: prepend tip and count as unread unless already read. */
export function recordNewEmployeeTip(empId: string, tip: TipItem): void {
  if (employeeId !== empId) {
    employeeId = empId;
    loadReadIds(empId);
  }
  if (!knownTipIds.includes(tip.id)) {
    knownTipIds = [tip.id, ...knownTipIds];
  }
  recomputeUnread();
  notify();
}

export function markEmployeeTipsRead(ids: string[]): void {
  let changed = false;
  for (const id of ids) {
    if (!readIds.has(id)) {
      readIds.add(id);
      changed = true;
    }
  }
  if (!changed) return;
  persistReadIds();
  recomputeUnread();
  notify();
}

/** Opening the notifications panel — all current tips are considered seen. */
export function markAllEmployeeTipsRead(): void {
  let changed = false;
  for (const id of knownTipIds) {
    if (!readIds.has(id)) {
      readIds.add(id);
      changed = true;
    }
  }
  if (!changed && unreadCount === 0) return;
  persistReadIds();
  unreadCount = 0;
  notify();
}

export function removeEmployeeTipsFromStore(ids: string[]): void {
  knownTipIds = knownTipIds.filter((id) => !ids.includes(id));
  for (const id of ids) readIds.delete(id);
  persistReadIds();
  recomputeUnread();
  notify();
}

export function clearEmployeeNotifications(): void {
  employeeId = null;
  readIds = new Set();
  knownTipIds = [];
  unreadCount = 0;
  notify();
}
