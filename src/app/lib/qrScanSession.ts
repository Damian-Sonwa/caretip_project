/** Sprint 4F — guest scan session id shared across QR API calls and checkout. */
const STORAGE_KEY = "caretip_qr_scan_session";

export function getOrCreateQrScanSessionId(): string {
  try {
    const existing = sessionStorage.getItem(STORAGE_KEY);
    if (existing?.trim()) return existing.trim().slice(0, 64);
    const id = crypto.randomUUID().replace(/-/g, "").slice(0, 32);
    sessionStorage.setItem(STORAGE_KEY, id);
    return id;
  } catch {
    return "anonymous";
  }
}

/** Header sent on public guest requests so scan + funnel events share one session. */
export function guestQrScanHeaders(): Record<string, string> {
  return { "x-caretip-scan-session": getOrCreateQrScanSessionId() };
}
