import { AUTH_WINDOW_1H_MS } from "../config/authRateLimit.config.js";
import { checkAndIncrementLimit } from "./layeredRateLimit.js";

/** @deprecated Prefer layered auth middleware — kept for legacy call sites. */
export function checkAndIncrementEmailLimit(params: {
  key: string;
  maxPerWindow: number;
  nowMs?: number;
}): { allowed: boolean; count: number; resetAtMs: number } {
  return checkAndIncrementLimit({
    key: `legacy:email:${params.key.trim().toLowerCase()}`,
    maxPerWindow: params.maxPerWindow,
    windowMs: AUTH_WINDOW_1H_MS,
    nowMs: params.nowMs,
  });
}
