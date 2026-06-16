import type { Request, Response, NextFunction } from "express";

/**
 * Blocks public static serving of KYC / verification paths under `/uploads`.
 * KYC must use private Supabase Storage + authenticated `/api/media/secure-*` only.
 */
export function blockSensitiveStaticUploadPaths(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const normalized = req.path.replace(/\\/g, "/").toLowerCase();
  if (
    normalized.startsWith("/uploads/kyc") ||
    normalized.includes("/platform-verification/") ||
    normalized.startsWith("/uploads/platform-verification")
  ) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  next();
}
