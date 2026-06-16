type Bucket = {
  count: number;
  resetAtMs: number;
};

/** Process-local sliding windows — suitable for single-instance; use Redis for multi-node parity. */
const buckets = new Map<string, Bucket>();

export type LayeredRateLimitResult = {
  allowed: boolean;
  count: number;
  resetAtMs: number;
};

export function checkAndIncrementLimit(params: {
  key: string;
  maxPerWindow: number;
  windowMs: number;
  nowMs?: number;
}): LayeredRateLimitResult {
  const nowMs = params.nowMs ?? Date.now();
  const k = params.key.trim();
  if (!k) {
    return { allowed: true, count: 0, resetAtMs: nowMs + params.windowMs };
  }

  const cur = buckets.get(k);
  if (!cur || cur.resetAtMs <= nowMs) {
    const next: Bucket = { count: 1, resetAtMs: nowMs + params.windowMs };
    buckets.set(k, next);
    return { allowed: 1 <= params.maxPerWindow, count: 1, resetAtMs: next.resetAtMs };
  }

  cur.count += 1;
  buckets.set(k, cur);

  if (buckets.size > 10_000 && Math.random() < 0.02) {
    for (const [kk, vv] of buckets) {
      if (vv.resetAtMs <= nowMs) buckets.delete(kk);
    }
  }

  return { allowed: cur.count <= params.maxPerWindow, count: cur.count, resetAtMs: cur.resetAtMs };
}

/** Read current bucket without incrementing (for lockout checks). */
export function peekLimit(params: {
  key: string;
  maxPerWindow: number;
  windowMs: number;
  nowMs?: number;
}): LayeredRateLimitResult {
  const nowMs = params.nowMs ?? Date.now();
  const k = params.key.trim();
  if (!k) {
    return { allowed: true, count: 0, resetAtMs: nowMs + params.windowMs };
  }
  const cur = buckets.get(k);
  if (!cur || cur.resetAtMs <= nowMs) {
    return { allowed: true, count: 0, resetAtMs: nowMs + params.windowMs };
  }
  return {
    allowed: cur.count < params.maxPerWindow,
    count: cur.count,
    resetAtMs: cur.resetAtMs,
  };
}

export type RateLimitLayer = {
  name: string;
  key: string;
  max: number;
  windowMs: number;
};

export function enforceRateLimitLayers(
  layers: RateLimitLayer[],
): { ok: true } | { ok: false; layer: string; resetAtMs: number } {
  for (const layer of layers) {
    if (!layer.key) continue;
    const result = checkAndIncrementLimit({
      key: layer.key,
      maxPerWindow: layer.max,
      windowMs: layer.windowMs,
    });
    if (!result.allowed) {
      return { ok: false, layer: layer.name, resetAtMs: result.resetAtMs };
    }
  }
  return { ok: true };
}
