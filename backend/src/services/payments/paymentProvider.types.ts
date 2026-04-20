/**
 * Shared shapes for payment adapters. Add PayPal / other providers by implementing
 * a factory that returns the same session + webhook contracts (see stripe.service.ts).
 */
export interface TipCheckoutSessionRequest {
  amount: number;
  employeeId: string;
  businessId: string;
  customerName?: string;
  feedback?: string;
}

export interface TipCheckoutSessionResult {
  sessionId: string;
  url: string | null;
}
