import type { ErrorRequestHandler, Request } from "express";

type RequestWithRawJson = Request & { _rawJsonBody?: string };

function isJsonBodyParseError(err: unknown): boolean {
  if (!(err instanceof SyntaxError)) return false;
  const e = err as SyntaxError & { status?: number; type?: string; body?: unknown };
  return e.status === 400 && (e.type === "entity.parse.failed" || "body" in e);
}

/**
 * Catches `express.json()` / body-parser failures so clients get JSON instead of an HTML 500.
 * Must be registered immediately after `express.json()`.
 */
export const jsonParseErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (!isJsonBodyParseError(err)) {
    next(err);
    return;
  }

  const raw = (req as RequestWithRawJson)._rawJsonBody;
  const preview =
    typeof raw === "string" && raw.length > 0
      ? raw.length > 120
        ? `${raw.slice(0, 120)}…`
        : raw
      : undefined;

  console.error("❌ Invalid JSON request body:", {
    method: req.method,
    path: req.originalUrl ?? req.url,
    preview,
    message: err instanceof Error ? err.message : String(err),
  });

  res.status(400).json({
    message:
      "The request body was not valid JSON. Send a JSON object (for example {\"email\":\"...\",\"password\":\"...\"}) with Content-Type: application/json.",
  });
};
