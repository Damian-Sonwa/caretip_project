/**
 * Shared Resend HTTP client (same pattern as password reset — forgot-password flow is the reference).
 *
 * Resend requires `from` to be `email@example.com` or `Display Name <email@example.com>` — a bare domain
 * (e.g. `caretip.de`) returns 422 validation_error.
 */

const DEFAULT_RESEND_FROM = "CareTip <onboarding@resend.dev>";

/** Plain `user@host.tld` or `Name <user@host.tld>`. */
function isValidResendFromFormat(value: string): boolean {
  const v = value.trim();
  if (!v) return false;
  const plain = /^[^\s<>]+@[^\s<>]+\.[^\s<>]+$/;
  if (plain.test(v)) return true;
  const named = /^(.+?)\s*<([^\s<>]+@[^\s<>]+\.[^\s<>]+)>\s*$/;
  const m = named.exec(v);
  return m != null && plain.test(m[2]);
}

let warnedInvalidResendFrom = false;

function getResendFromAddress(): string {
  const raw = process.env.RESEND_FROM?.trim();
  if (!raw) {
    return DEFAULT_RESEND_FROM;
  }
  if (isValidResendFromFormat(raw)) {
    return raw;
  }
  if (!warnedInvalidResendFrom) {
    warnedInvalidResendFrom = true;
    console.warn(
      `[resend] RESEND_FROM must be a full address (e.g. "noreply@yourdomain.com" or "CareTip <noreply@yourdomain.com>"). ` +
        `Got ${JSON.stringify(raw)} — using default ${DEFAULT_RESEND_FROM}. Set RESEND_FROM to a verified sender in Resend.`
    );
  }
  return DEFAULT_RESEND_FROM;
}

function getResendApiKey(): string | undefined {
  return process.env.RESEND_API_KEY?.trim() || undefined;
}

export { getResendFromAddress };

export type ResendMailPayload = {
  from: string;
  to: string[];
  subject: string;
  html: string;
  /** Resend accepts optional plain-text part (improves deliverability). */
  text?: string;
};

/**
 * Sends one message via Resend. Does not throw on failure — logs and returns success flag.
 * Callers keep token logic separate; this only posts to Resend.
 */
export async function sendResendEmail(logTag: string, payload: ResendMailPayload): Promise<boolean> {
  const resendKey = getResendApiKey();
  const from = payload.from || getResendFromAddress();

  if (!resendKey) {
    if (process.env.NODE_ENV !== "production") {
      console.info(`[resend][${logTag}] RESEND_API_KEY not set; skipping send (dev).`);
    } else {
      console.warn(`[resend][${logTag}] RESEND_API_KEY not set; email was not sent.`);
    }
    return false;
  }

  const body: Record<string, unknown> = {
    from,
    to: payload.to,
    subject: payload.subject,
    html: payload.html,
  };
  if (payload.text) {
    body.text = payload.text;
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const t = await r.text();
      console.error("[resend] Email sending failed:", { tag: logTag, status: r.status, body: t.slice(0, 800) });
      return false;
    }
    console.info(`[resend][${logTag}] Email sent`, { to: payload.to[0] });
    return true;
  } catch (error) {
    console.error("[resend] Email sending failed:", { tag: logTag, error });
    return false;
  }
}
