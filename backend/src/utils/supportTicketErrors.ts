import { clientSafeMessage } from "../utils/httpErrors.js";

const SUPPORT_VALIDATION_MESSAGES = new Set<string>([
  "Subject is required",
  "Message is required",
  "Invalid category",
  "Invalid status",
  "Reply cannot be empty",
  "Ticket is closed",
  "Ticket not found",
  "Business not found",
  "Cannot change status of a closed ticket",
]);

function validationMessageFromError(err: unknown): string | null {
  const msg = err instanceof Error ? err.message : "";
  if (!msg) return null;
  if (SUPPORT_VALIDATION_MESSAGES.has(msg)) return msg;
  if (msg.includes("Subject")) return "Subject is required";
  if (msg.includes("Message") && !msg.includes("Reply")) return "Message is required";
  if (msg.includes("Reply") && msg.includes("empty")) return "Reply cannot be empty";
  if (msg.includes("closed")) return "Ticket is closed";
  if (msg.includes("not found")) return "Ticket not found";
  if (msg.includes("Invalid status")) return "Invalid status";
  if (msg.includes("Cannot change")) return "Cannot change status of a closed ticket";
  return null;
}

export function supportTicketHttpError(
  err: unknown,
  fallback: string,
): { status: number; message: string } {
  const validation = validationMessageFromError(err);
  if (validation) {
    return { status: 400, message: validation };
  }
  return { status: 500, message: clientSafeMessage(err, fallback) };
}
