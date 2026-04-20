type Bucket = {
  count: number;
  resetAtMs: number;
};

const WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * In-memory per-email rate limiter.
 * Notes:
 * - Process-local (resets on server restart).
 * - Good for dev / single-instance deployments.
 */
const buckets = new Map<string, Bucket>();

export function checkAndIncrementEmailLimit(params: {
  key: string;
  maxPerWindow: number;
  nowMs?: number;
}): { allowed: boolean; count: number; resetAtMs: number } {
  const nowMs = params.nowMs ?? Date.now();
  const k = params.key.trim().toLowerCase();
  if (!k) {
    // No key: do not block, do not track.
    return { allowed: true, count: 0, resetAtMs: nowMs + WINDOW_MS };
  }

  const cur = buckets.get(k);
  if (!cur || cur.resetAtMs <= nowMs) {
    const next: Bucket = { count: 1, resetAtMs: nowMs + WINDOW_MS };
    buckets.set(k, next);
    return { allowed: 1 <= params.maxPerWindow, count: 1, resetAtMs: next.resetAtMs };
  }

  cur.count += 1;
  buckets.set(k, cur);

  // Opportunistic cleanup so the map doesn't grow unbounded.
  if (buckets.size > 5000 && Math.random() < 0.02) {
    for (const [kk, vv] of buckets) {
      if (vv.resetAtMs <= nowMs) buckets.delete(kk);
    }
  }

  return { allowed: cur.count <= params.maxPerWindow, count: cur.count, resetAtMs: cur.resetAtMs };
}

