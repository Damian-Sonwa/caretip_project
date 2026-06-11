import { prisma } from "../prisma.js";

const RETENTION_DAYS = 30;

/** Returns true when this Stripe event id was already processed successfully. */
export async function isStripeWebhookEventProcessed(eventId: string): Promise<boolean> {
  const row = await prisma.stripeWebhookEvent.findUnique({
    where: { id: eventId },
    select: { id: true },
  });
  return Boolean(row);
}

/** Record successful processing — safe to call after handler completes. */
export async function markStripeWebhookEventProcessed(
  eventId: string,
  eventType: string,
): Promise<void> {
  await prisma.stripeWebhookEvent.upsert({
    where: { id: eventId },
    create: { id: eventId, eventType },
    update: { eventType, processedAt: new Date() },
  });

  if (Math.random() < 0.01) {
    const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    await prisma.stripeWebhookEvent.deleteMany({
      where: { processedAt: { lt: cutoff } },
    });
  }
}
