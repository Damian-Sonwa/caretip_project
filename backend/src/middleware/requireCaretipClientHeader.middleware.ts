import type { Request, Response, NextFunction } from "express";

export const CARETIP_CLIENT_HEADER = "x-caretip-client";
export const CARETIP_CLIENT_HEADER_VALUE = "1";

/**
 * Blocks simple HTML form CSRF — only the CareTip SPA sends this custom header on fetch().
 */
export function requireCaretipClientHeader(req: Request, res: Response, next: NextFunction): void {
  const value = req.get(CARETIP_CLIENT_HEADER)?.trim();
  if (value !== CARETIP_CLIENT_HEADER_VALUE) {
    res.status(400).json({ message: "Invalid request" });
    return;
  }
  next();
}
