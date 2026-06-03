/**
 * Read-only Stripe webhook audit — prints status only, never secrets.
 * Run: npx tsx scripts/auditStripeWebhooks.ts
 */
import "dotenv/config";
import "../src/loadEnv.js";
import Stripe from "stripe";
import { prisma } from "../src/prisma.js";

const ENDPOINT_PATHS = [
  "/api/webhooks/stripe",
  "/api/webhook/stripe",
] as const;

function maskHost(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.hostname}${u.pathname}`;
  } catch {
    return url.replace(/\/\/[^@]+@/, "//***@");
  }
}

async function main() {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const frontendUrl = process.env.FRONTEND_URL?.trim();
  const apiBase =
    process.env.RENDER_EXTERNAL_URL?.trim() ||
    process.env.API_PUBLIC_URL?.trim() ||
    process.env.VITE_API_URL?.trim() ||
    null;

  const report: Record<string, unknown> = {
    env: {
      STRIPE_SECRET_KEY: secretKey ? "present" : "missing",
      STRIPE_WEBHOOK_SECRET: webhookSecret ? "present" : "missing",
      FRONTEND_URL: frontendUrl || "missing (defaults to http://localhost:5173 in checkout)",
      inferredApiBase: apiBase ? maskHost(apiBase) : "not set (set RENDER_EXTERNAL_URL or API_PUBLIC_URL for expected webhook URLs)",
    },
    expectedEndpointUrls: ENDPOINT_PATHS.map((p) =>
      apiBase ? `${apiBase.replace(/\/$/, "")}${p}` : `(API base unknown)${p}`,
    ),
    stripeDashboardWebhooks: [] as Array<{
      id: string;
      url: string;
      status: string;
      enabledEvents: string[];
      apiVersion: string | null;
    }>,
    recentDbTips: [] as Array<{
      id: string;
      amount: number;
      status: string;
      stripePaymentIntentId: string | null;
      createdAt: string;
    }>,
    dbTipStats: { total: 0, withStripePi: 0, successWithStripePi: 0 },
    stripeEventAttempts: null as unknown,
    notes: [] as string[],
  };

  const tips = await prisma.transaction.findMany({
    where: { stripePaymentIntentId: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      amount: true,
      status: true,
      stripePaymentIntentId: true,
      createdAt: true,
    },
  });

  const [total, withPi, successPi] = await Promise.all([
    prisma.transaction.count(),
    prisma.transaction.count({ where: { stripePaymentIntentId: { not: null } } }),
    prisma.transaction.count({
      where: { stripePaymentIntentId: { not: null }, status: "success" },
    }),
  ]);

  report.recentDbTips = tips.map((t) => ({
    id: t.id,
    amount: Number(t.amount),
    status: t.status,
    stripePaymentIntentId: t.stripePaymentIntentId,
    createdAt: t.createdAt.toISOString(),
  }));
  report.dbTipStats = { total, withStripePi: withPi, successWithStripePi: successPi };

  if (!secretKey) {
    report.notes.push(
      "STRIPE_SECRET_KEY missing — cannot list Stripe Dashboard webhook endpoints or event delivery logs.",
    );
  } else {
    const stripe = new Stripe(secretKey);
    const webhooks = await stripe.webhookEndpoints.list({ limit: 20 });
    report.stripeDashboardWebhooks = webhooks.data.map((w) => ({
      id: w.id,
      url: w.url,
      status: w.status,
      enabledEvents: w.enabled_events as string[],
      apiVersion: w.api_version,
    }));

    const requiredEvents = [
      "checkout.session.completed",
      "payment_intent.succeeded",
      "payment_intent.payment_failed",
      "payment_intent.canceled",
    ];
    const registeredUrls = new Set(webhooks.data.map((w) => w.url));
    const hasMatchingEndpoint = ENDPOINT_PATHS.some((p) =>
      [...registeredUrls].some((u) => u.endsWith(p) || u.includes(p)),
    );
    if (webhooks.data.length === 0) {
      report.notes.push("No webhook endpoints registered in this Stripe account.");
    } else if (!hasMatchingEndpoint && apiBase) {
      report.notes.push(
        "Stripe has webhook endpoints, but none match expected /api/webhooks/stripe paths for this API base.",
      );
    }

    for (const ev of requiredEvents) {
      const covered = webhooks.data.some(
        (w) =>
          w.status === "enabled" &&
          (w.enabled_events.includes(ev) || w.enabled_events.includes("*")),
      );
      if (!covered) {
        report.notes.push(`Event not enabled on any active webhook: ${ev}`);
      }
    }

    // Recent event delivery attempts (last 10 checkout/payment_intent events)
    try {
      const events = await stripe.events.list({ limit: 25 });
      const relevant = events.data.filter((e) =>
        [
          "checkout.session.completed",
          "payment_intent.succeeded",
          "payment_intent.payment_failed",
          "payment_intent.canceled",
        ].includes(e.type),
      );
      report.stripeEventAttempts = {
        lastRelevantEvent: relevant[0]
          ? {
              id: relevant[0].id,
              type: relevant[0].type,
              created: new Date(relevant[0].created * 1000).toISOString(),
              livemode: relevant[0].livemode,
            }
          : null,
        recentRelevantCount: relevant.length,
        recentTypes: relevant.slice(0, 5).map((e) => ({
          type: e.type,
          id: e.id,
          created: new Date(e.created * 1000).toISOString(),
        })),
      };
    } catch (e) {
      report.notes.push(`Could not list Stripe events: ${(e as Error).message}`);
    }
  }

  if (!webhookSecret) {
    report.notes.push(
      "STRIPE_WEBHOOK_SECRET missing — webhook route returns 400 before signature verification.",
    );
  }

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((e) => {
    console.error("AUDIT_FAILED", e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
