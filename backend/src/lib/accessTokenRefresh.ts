import jwt from "jsonwebtoken";
import type { JwtPayload } from "../middleware/auth.middleware.js";

/** Grace period after access JWT expiry — allows session recovery when refresh cookie was lost (e.g. dev proxy misconfig). */
const EXPIRED_ACCESS_GRACE_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Resolve user id from Bearer access token for POST /api/auth/refresh fallback.
 * Accepts valid tokens and recently expired tokens (within grace).
 */
export function userIdFromAccessTokenForRefresh(bearer: string): string | null {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) return null;
  const token = String(bearer ?? "").trim();
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload & { exp?: number };
    const userId = decoded.userId ?? decoded.id;
    return typeof userId === "string" && userId.trim() ? userId.trim() : null;
  } catch (err) {
    if (!(err instanceof jwt.TokenExpiredError)) return null;
    try {
      const decoded = jwt.verify(token, secret, { ignoreExpiration: true }) as JwtPayload & {
        exp?: number;
      };
      const exp = decoded.exp;
      if (typeof exp === "number" && Date.now() - exp * 1000 > EXPIRED_ACCESS_GRACE_MS) {
        return null;
      }
      const userId = decoded.userId ?? decoded.id;
      return typeof userId === "string" && userId.trim() ? userId.trim() : null;
    } catch {
      return null;
    }
  }
}
