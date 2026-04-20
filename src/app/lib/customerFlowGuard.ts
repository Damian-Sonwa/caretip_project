const KEY = "caretip_customer_flow_entry_v1";
const REF_KEY = "caretip_customer_flow_ref_v1";

// Keep short-lived: enough for a typical tip journey, not a persistent bypass.
const TTL_MS = 30 * 60 * 1000;

function now(): number {
  return Date.now();
}

function sameOriginReferrer(ref: string): boolean {
  try {
    if (!ref) return true; // empty referrer is common (privacy settings, new tab)
    const u = new URL(ref);
    return u.origin === window.location.origin;
  } catch {
    return false;
  }
}

export function hasSameOriginReferrerNow(): boolean {
  if (import.meta.env.DEV) return true;
  return sameOriginReferrer(document.referrer || "");
}

export function markCustomerFlowEntered(): void {
  if (import.meta.env.DEV) return; // dev uses its own bypass
  try {
    sessionStorage.setItem(KEY, String(now()));
    // QR scans often enter from an external app; don't "lock out" the rest of the flow
    // just because the referrer is cross-origin.
    const ref = document.referrer || "";
    sessionStorage.setItem(REF_KEY, sameOriginReferrer(ref) ? ref : "");
  } catch {
    // ignore storage failures
  }
}

export function hasRecentCustomerFlowEntry(): boolean {
  if (import.meta.env.DEV) return true;
  try {
    const raw = sessionStorage.getItem(KEY);
    const t = raw ? Number(raw) : 0;
    if (!Number.isFinite(t) || t <= 0) return false;
    const ref = sessionStorage.getItem(REF_KEY) || "";
    // Production hardening: if we have a referrer recorded and it's not same-origin, deny.
    if (!sameOriginReferrer(ref)) return false;
    return now() - t <= TTL_MS;
  } catch {
    return false;
  }
}

export function clearCustomerFlowEntry(): void {
  if (import.meta.env.DEV) return;
  try {
    sessionStorage.removeItem(KEY);
    sessionStorage.removeItem(REF_KEY);
  } catch {
    // ignore
  }
}

