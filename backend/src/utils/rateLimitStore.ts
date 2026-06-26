import type { LayeredRateLimitResult } from "./layeredRateLimit.js";
import { checkAndIncrementLimit as memoryCheckAndIncrement, peekLimit as memoryPeekLimit } from "./layeredRateLimit.js";

type RedisClient = {
  incr(key: string): Promise<number>;
  get(key: string): Promise<string | null>;
  pexpire(key: string, ms: number): Promise<number>;
  quit(): Promise<string>;
};

let redisClient: RedisClient | null = null;
let redisInitAttempted = false;
let redisReady = false;

async function getRedis(): Promise<RedisClient | null> {
  if (redisInitAttempted) return redisReady ? redisClient : null;
  redisInitAttempted = true;
  const url = process.env.REDIS_URL?.trim();
  if (!url) {
    console.info("[rateLimit] REDIS_URL not set — using in-memory buckets");
    return null;
  }
  let client: (RedisClient & { connect(): Promise<void>; disconnect(): void }) | null = null;
  try {
    const RedisModule = await import("ioredis");
    const RedisCtor = RedisModule.default as unknown as new (
      url: string,
      opts?: Record<string, unknown>,
    ) => RedisClient & { connect(): Promise<void>; disconnect(): void };
    client = new RedisCtor(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      retryStrategy: () => null,
    });
    client.on("error", () => {
      // absorbed — avoids ioredis "Unhandled error event" when host is unreachable
    });
    await client.connect();
    redisClient = client as unknown as RedisClient;
    redisReady = true;
    console.info("[rateLimit] Redis connected for distributed auth limits");
    return redisClient;
  } catch (err) {
    client?.disconnect();
    console.warn("[rateLimit] Redis unavailable — falling back to in-memory", err);
    redisClient = null;
    redisReady = false;
    return null;
  }
}

/**
 * Distributed fixed-window counter. Falls back to process memory when Redis is absent.
 */
export async function checkAndIncrementLimitDistributed(params: {
  key: string;
  maxPerWindow: number;
  windowMs: number;
  nowMs?: number;
}): Promise<LayeredRateLimitResult> {
  const nowMs = params.nowMs ?? Date.now();
  const k = params.key.trim();
  if (!k) {
    return { allowed: true, count: 0, resetAtMs: nowMs + params.windowMs };
  }

  const redis = await getRedis();
  if (!redis) {
    return memoryCheckAndIncrement(params);
  }

  try {
    const count = await redis.incr(k);
    if (count === 1) {
      await redis.pexpire(k, params.windowMs);
    }
    const resetAtMs = nowMs + params.windowMs;
    return {
      allowed: count <= params.maxPerWindow,
      count,
      resetAtMs,
    };
  } catch (err) {
    console.warn("[rateLimit] Redis incr failed — memory fallback", err);
    return memoryCheckAndIncrement(params);
  }
}

/** Peek without incrementing — used for MFA lockout checks. */
export async function peekLimitDistributed(params: {
  key: string;
  maxPerWindow: number;
  windowMs: number;
  nowMs?: number;
}): Promise<LayeredRateLimitResult> {
  const nowMs = params.nowMs ?? Date.now();
  const k = params.key.trim();
  if (!k) {
    return { allowed: true, count: 0, resetAtMs: nowMs + params.windowMs };
  }

  const redis = await getRedis();
  if (!redis) {
    return memoryPeekLimit(params);
  }

  try {
    const raw = await redis.get(k);
    const count = raw ? Number.parseInt(raw, 10) : 0;
    const resetAtMs = nowMs + params.windowMs;
    return {
      allowed: count < params.maxPerWindow,
      count: Number.isFinite(count) ? count : 0,
      resetAtMs,
    };
  } catch (err) {
    console.warn("[rateLimit] Redis peek failed — memory fallback", err);
    return memoryPeekLimit(params);
  }
}

export async function enforceRateLimitLayersDistributed(
  layers: Array<{ name: string; key: string; max: number; windowMs: number }>,
): Promise<{ ok: true } | { ok: false; layer: string; resetAtMs: number }> {
  for (const layer of layers) {
    if (!layer.key) continue;
    const result = await checkAndIncrementLimitDistributed({
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
