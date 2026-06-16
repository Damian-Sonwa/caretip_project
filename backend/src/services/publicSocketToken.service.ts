import jwt from "jsonwebtoken";

const PURPOSE = "public_socket_room";
const DEFAULT_TTL_SEC = 5 * 60;

export type PublicSocketTokenPayload = {
  businessId: string;
  purpose: typeof PURPOSE;
};

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET?.trim();
  if (!secret) throw new Error("JWT_SECRET not configured");
  return secret;
}

export function signPublicSocketRoomToken(
  businessId: string,
  ttlSec = DEFAULT_TTL_SEC,
): { token: string; expiresAt: string } {
  const expiresAt = new Date(Date.now() + ttlSec * 1000);
  const token = jwt.sign(
    { businessId, purpose: PURPOSE } satisfies PublicSocketTokenPayload,
    jwtSecret(),
    { expiresIn: ttlSec },
  );
  return { token, expiresAt: expiresAt.toISOString() };
}

export function businessIdFromPublicSocketRoomToken(token: string): string | null {
  if (!token.trim()) return null;
  try {
    const decoded = jwt.verify(token.trim(), jwtSecret()) as PublicSocketTokenPayload;
    if (decoded.purpose !== PURPOSE) return null;
    if (typeof decoded.businessId !== "string" || !decoded.businessId.trim()) return null;
    return decoded.businessId.trim();
  } catch {
    return null;
  }
}
