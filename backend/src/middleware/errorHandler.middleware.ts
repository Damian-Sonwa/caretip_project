import type { ErrorRequestHandler } from "express";
import multer from "multer";
import { clientSafeMessage, CLIENT_FALLBACK } from "../utils/httpErrors.js";

/**
 * Last middleware: logs server errors and returns JSON. Requires `express-async-errors` so async route rejections reach here.
 */
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (res.headersSent) {
    next(err);
    return;
  }

  const status =
    typeof err === "object" && err !== null && "status" in err && typeof (err as { status: unknown }).status === "number"
      ? (err as { status: number }).status
      : 500;

  // Log detailed errors on server only (do not expose stack traces / DB internals to clients).
  const context = {
    method: req.method,
    path: req.originalUrl ?? req.url,
    status,
  };
  if (err instanceof multer.MulterError) {
    console.error("❌ BACKEND ERROR (multer):", context, err.code, err.message);
    if (err.stack) console.error(err.stack);
  } else {
    console.error("❌ BACKEND ERROR:", context, err);
    if (err instanceof Error && err.stack) console.error(err.stack);
  }

  // Keep response shape stable: frontend reads `message` (see src/app/lib/api.ts handleRes).
  // For expected client errors (4xx), return allow-listed / Prisma-classified messages.
  // For 5xx and unknown failures, keep a generic client message while logging details above.
  const message =
    status >= 400 && status < 500
      ? clientSafeMessage(err, CLIENT_FALLBACK.generic)
      : CLIENT_FALLBACK.generic;

  res.status(status).json({ message });
};
