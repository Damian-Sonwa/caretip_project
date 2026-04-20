import { prisma } from "../prisma.js";

/**
 * Append-only audit trail for platform admin and other sensitive actions.
 * Failures are swallowed so logging never breaks the main request.
 */
export async function writeAuditLog(input: {
  userId: string;
  action: string;
  metadata?: string | null;
}): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        metadata: input.metadata ?? undefined,
      },
    });
  } catch {
    /* ignore — audit must not break primary flow */
  }
}
