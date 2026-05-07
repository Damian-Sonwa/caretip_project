import Stripe from "stripe";
import { emitNewTip } from "../socket/emitTip.js";
import { prisma } from "../prisma.js";
import { businessUtcRangeForTimeframe, sanitizeIanaTimezone } from "../utils/businessTime.js";

let stripeSingleton: Stripe | null = null;

/** True when server has a secret key — safe to call at runtime; does not construct Stripe. */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/** Lazy init — never `new Stripe("")` at module load (crashes on Render if env missing). */
function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("Stripe payment processing is not configured (set STRIPE_SECRET_KEY on the server)");
  }
  if (!stripeSingleton) {
    stripeSingleton = new Stripe(key);
  }
  return stripeSingleton;
}

/**
 * Verify Stripe webhook signature (raw body required — do not JSON-parse before this).
 */
export function verifyWebhookSignature(
  rawBody: Buffer,
  signature: string | string[] | undefined,
): Stripe.Event {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error("STRIPE_WEBHOOK_SECRET not configured");
  }
  const sig = Array.isArray(signature) ? signature[0] : signature;
  if (!sig || typeof sig !== "string") {
    throw new Error("Missing stripe-signature header");
  }
  return getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
}

function frontendBaseUrl(): string {
  return (process.env.FRONTEND_URL ?? "http://localhost:5173").replace(/\/$/, "");
}

export type TipCheckoutContext = {
  sessionId: string;
  paymentIntentId: string | null;
  employeeId: string | null;
  businessId: string | null;
  locationId: string | null;
  tableId: string | null;
  customerName: string | null;
};

/**
 * Public feedback pages need to resolve a Stripe Checkout session id into
 * business/employee/venue context and (eventually) a Transaction row.
 */
export async function getTipCheckoutContext(
  sessionId: string,
): Promise<TipCheckoutContext> {
  const stripe = getStripe();
  const s = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
  const md = s.metadata ?? {};
  const pi = s.payment_intent;
  const paymentIntentId =
    typeof pi === "string" ? pi : pi?.id ?? null;

  return {
    sessionId: s.id,
    paymentIntentId,
    employeeId: typeof md.employeeId === "string" ? md.employeeId : null,
    businessId: typeof md.businessId === "string" ? md.businessId : null,
    locationId: typeof md.locationId === "string" ? md.locationId : null,
    tableId: typeof md.tableId === "string" ? md.tableId : null,
    customerName: typeof md.customerName === "string" ? md.customerName : null,
  };
}

export interface CreatePaymentIntentInput {
  amount: number;
  employeeId: string;
  businessId: string;
  locationId?: string | null;
  tableId?: string | null;
}

export interface CreatePaymentIntentResult {
  clientSecret: string;
  paymentIntentId: string;
}

export interface CreateTipCheckoutSessionInput {
  /** Total EUR charged in Stripe (bill + tip when both apply). */
  amount: number;
  employeeId: string;
  businessId: string;
  /** Tip portion stored on `tips.amount` and in metadata; defaults to `amount`. */
  tipAmount?: number;
  locationId?: string | null;
  tableId?: string | null;
  customerName?: string | null;
  feedback?: string | null;
}

export interface CreateTipCheckoutSessionResult {
  sessionId: string;
  url: string | null;
}

async function resolveLocationTable(
  businessId: string,
  locationId?: string | null,
  tableId?: string | null,
): Promise<{ locationId: string | null; tableId: string | null }> {
  const trimmedLoc = typeof locationId === "string" && locationId.trim() ? locationId.trim() : null;
  const trimmedTbl = typeof tableId === "string" && tableId.trim() ? tableId.trim() : null;
  let resolvedLocationId: string | null = trimmedLoc;
  let resolvedTableId: string | null = trimmedTbl;

  if (resolvedTableId) {
    const table = await prisma.table.findUnique({
      where: { id: resolvedTableId },
      select: {
        id: true,
        locationId: true,
        location: { select: { businessId: true } },
      },
    });
    if (!table || table.location.businessId !== businessId) {
      throw new Error("Table not found");
    }
    resolvedLocationId = table.locationId;
    resolvedTableId = table.id;
  } else if (resolvedLocationId) {
    const loc = await prisma.location.findFirst({
      where: { id: resolvedLocationId, businessId },
      select: { id: true },
    });
    if (!loc) {
      throw new Error("Location not found");
    }
  }
  return { locationId: resolvedLocationId, tableId: resolvedTableId };
}

async function emitTipSocket(tipId: string): Promise<void> {
  const tip = await prisma.transaction.findUnique({
    where: { id: tipId },
    include: { employee: true },
  });
  if (!tip?.employee) return;

  const business = await prisma.business.findUnique({
    where: { id: tip.businessId },
    select: { timezone: true },
  });
  const tz = sanitizeIanaTimezone(business?.timezone);
  const monthRange = businessUtcRangeForTimeframe("month", tz);
  const currentMonthTotalAgg = await prisma.transaction.aggregate({
    where: {
      employeeId: tip.employeeId,
      status: "success",
      ...(monthRange != null
        ? { createdAt: { gte: monthRange.startUtc, lte: monthRange.endUtc } }
        : { createdAt: { gte: new Date(0) } }),
    },
    _sum: { amount: true },
  });
  const currentMonthTotal = Number(currentMonthTotalAgg._sum.amount ?? 0);
  const monthlyGoal = tip.employee.monthlyGoal != null ? Number(tip.employee.monthlyGoal) : null;

  emitNewTip({
    tip: {
      id: tip.id,
      amount: Number(tip.amount),
      status: tip.status,
      createdAt: tip.createdAt.toISOString(),
    },
    employeeId: tip.employeeId,
    employeeName: tip.employee.name,
    businessId: tip.businessId,
    currentMonthTotal,
    monthlyGoal,
  });
}

export async function createPaymentIntent(
  input: CreatePaymentIntentInput,
): Promise<CreatePaymentIntentResult> {
  const stripe = getStripe();

  const employee = await prisma.employee.findUnique({
    where: { id: input.employeeId },
    select: { businessId: true },
  });

  if (!employee || employee.businessId !== input.businessId) {
    throw new Error("Employee not found");
  }

  const business = await prisma.business.findUnique({
    where: { id: input.businessId },
    select: { id: true },
  });

  if (!business) {
    throw new Error("Business not found");
  }

  const { locationId: locId, tableId: tblId } = await resolveLocationTable(
    input.businessId,
    input.locationId,
    input.tableId,
  );

  const amountInCents = Math.round(input.amount * 100);

  const metadata: Record<string, string> = {
    employeeId: input.employeeId,
    businessId: input.businessId,
    source: "payment_intent_api",
  };
  if (locId) metadata.locationId = locId;
  if (tblId) metadata.tableId = tblId;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: "eur",
    automatic_payment_methods: { enabled: true },
    metadata,
  });

  await prisma.transaction.create({
    data: {
      amount: input.amount,
      status: "pending",
      stripePaymentIntentId: paymentIntent.id,
      employeeId: input.employeeId,
      businessId: input.businessId,
      locationId: locId,
      tableId: tblId,
    },
  });

  return {
    clientSecret: paymentIntent.client_secret!,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Stripe Checkout — Apple Pay / Google Pay / card on Stripe-hosted page (EUR).
 * Wallets are offered by Stripe where supported when using `card`.
 */
export async function createTipCheckoutSession(
  input: CreateTipCheckoutSessionInput,
): Promise<CreateTipCheckoutSessionResult> {
  const stripe = getStripe();

  const { employeeId, businessId } = input;
  const total = Number(input.amount);
  const tipForRecord = input.tipAmount != null ? Number(input.tipAmount) : total;

  if (!employeeId || !businessId || Number.isNaN(total) || total <= 0) {
    throw new Error("Invalid amount or business context");
  }
  if (Number.isNaN(tipForRecord) || tipForRecord <= 0) {
    throw new Error("Invalid tip amount");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { businessId: true },
  });
  if (!employee || employee.businessId !== businessId) {
    throw new Error("Employee not found");
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true },
  });
  if (!business) {
    throw new Error("Business not found");
  }

  const { locationId: locId, tableId: tblId } = await resolveLocationTable(
    businessId,
    input.locationId,
    input.tableId,
  );

  const totalCents = Math.round(total * 100);
  if (totalCents < 50) {
    throw new Error("Amount too small");
  }

  const base = frontendBaseUrl();
  const metadata: Record<string, string> = {
    employeeId,
    businessId,
    amount: String(total),
    tipAmount: String(tipForRecord),
    totalAmount: String(total),
    source: "checkout_session",
  };
  if (locId) metadata.locationId = locId;
  if (tblId) metadata.tableId = tblId;
  const name = input.customerName?.trim();
  if (name) metadata.customerName = name;
  const fb = input.feedback?.trim();
  if (fb) metadata.feedback = fb.slice(0, 2000);

  let session: Stripe.Checkout.Session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: totalCents,
            product_data: {
              name: "CareTip payment",
              description: `Tip €${tipForRecord.toFixed(2)}`,
            },
          },
          quantity: 1,
        },
      ],
      // Post-checkout: go directly to optional feedback page (no extra success screen).
      success_url: `${base}/rating?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/payment?canceled=1`,
      metadata,
    });
  } catch (e) {
    if (e instanceof Stripe.errors.StripeError) {
      console.error("[Stripe checkout.sessions.create]", e.code, e.message);
      throw new Error("Payment provider could not start checkout");
    }
    throw e;
  }

  return {
    sessionId: session.id,
    url: session.url,
  };
}

export async function handlePaymentSuccess(paymentIntentId: string): Promise<void> {
  await prisma.transaction.updateMany({
    where: { stripePaymentIntentId: paymentIntentId, status: "pending" },
    data: { status: "success" },
  });

  const tip = await prisma.transaction.findFirst({
    where: { stripePaymentIntentId: paymentIntentId },
    include: { employee: true },
  });

  if (!tip?.employee) {
    return;
  }

  await emitTipSocket(tip.id);
}

export async function handlePaymentFailed(paymentIntentId: string): Promise<void> {
  await prisma.transaction.updateMany({
    where: { stripePaymentIntentId: paymentIntentId, status: "pending" },
    data: { status: "failed" },
  });
}

/**
 * Persist tip from Stripe Checkout (idempotent on payment_intent id).
 * Alias for integrations that prefer an explicit name.
 */
export async function handleSuccessfulTipPayment(session: Stripe.Checkout.Session): Promise<void> {
  const pi = session.payment_intent;
  const piId = typeof pi === "string" ? pi : pi?.id ?? null;
  if (!piId) {
    return;
  }

  const dup = await prisma.transaction.findFirst({
    where: { stripePaymentIntentId: piId },
  });
  if (dup) {
    return;
  }

  const md = session.metadata ?? {};
  const employeeId = md.employeeId;
  const businessId = md.businessId;
  const tipAmount = parseFloat(md.tipAmount ?? md.amount ?? "0");

  if (!employeeId || !businessId || Number.isNaN(tipAmount) || tipAmount <= 0) {
    return;
  }

  let locId: string | null = null;
  let tblId: string | null = null;
  try {
    const r = await resolveLocationTable(businessId, md.locationId ?? null, md.tableId ?? null);
    locId = r.locationId;
    tblId = r.tableId;
  } catch {
    // ignore invalid venue metadata
  }

  const tip = await prisma.transaction.create({
    data: {
      amount: tipAmount,
      status: "success",
      stripePaymentIntentId: piId,
      employeeId,
      businessId,
      locationId: locId,
      tableId: tblId,
    },
  });

  await emitTipSocket(tip.id);
}

/** @deprecated Use handleSuccessfulTipPayment */
export const handleCheckoutSessionCompleted = handleSuccessfulTipPayment;
