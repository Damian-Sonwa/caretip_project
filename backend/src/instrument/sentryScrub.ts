/** Value substituted for scrubbed secrets/PII in Sentry payloads. */
export const SENTRY_SCRUBBED = "[Filtered]";

const SENSITIVE_KEY_RE =
  /(?:token|secret|password|authorization|cookie|api[_-]?key|service[_-]?role|database[_-]?url|supabase|stripe|openai|resend|^dsn$)/i;

const HEADER_NAMES_TO_SCRUB = new Set(["authorization", "cookie", "set-cookie"]);

/** Redact known secret shapes that may appear inside string values. */
const STRING_SECRET_PATTERNS: RegExp[] = [
  /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi,
  /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g,
  /postgres(?:ql)?:\/\/[^\s"'`,}]+/gi,
  /sk_(?:live|test)_[A-Za-z0-9]+/g,
  /whsec_[A-Za-z0-9]+/g,
  /sk-[A-Za-z0-9]{20,}/g,
  /re_[A-Za-z0-9]{20,}/g,
  /sbp_[A-Za-z0-9]{20,}/g,
  /service_role_[A-Za-z0-9_-]+/gi,
];

function scrubStringValue(raw: string): string {
  let out = raw;
  for (const pattern of STRING_SECRET_PATTERNS) {
    out = out.replace(pattern, SENTRY_SCRUBBED);
  }
  return out;
}

function shouldScrubKey(key: string): boolean {
  const normalized = key.trim().toLowerCase();
  if (HEADER_NAMES_TO_SCRUB.has(normalized)) return true;
  return SENSITIVE_KEY_RE.test(key);
}

function scrubUnknown(value: unknown, key: string | undefined, depth: number): unknown {
  if (depth > 14) return SENTRY_SCRUBBED;

  if (key && shouldScrubKey(key)) {
    return SENTRY_SCRUBBED;
  }

  if (typeof value === "string") {
    return scrubStringValue(value);
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => scrubUnknown(item, String(index), depth + 1));
  }

  if (value && typeof value === "object") {
    return scrubRecord(value as Record<string, unknown>, depth + 1);
  }

  return value;
}

function scrubRecord(record: Record<string, unknown>, depth: number): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    out[key] = scrubUnknown(value, key, depth);
  }
  return out;
}

/**
 * Deep-scrub a Sentry event (or subset) before it is transmitted.
 * Preserves structure and non-sensitive debugging fields.
 */
export function scrubSentryEvent<T extends Record<string, unknown>>(event: T): T {
  return scrubRecord(event, 0) as T;
}

export type SentryBeforeSendEvent = Parameters<
  NonNullable<import("@sentry/node").NodeOptions["beforeSend"]>
>[0];

export function sentryBeforeSend<E extends SentryBeforeSendEvent>(event: E): E {
  return scrubSentryEvent(event as unknown as Record<string, unknown>) as E;
}

/** Example payload for verification docs/tests — not sent to Sentry. */
export function sentryScrubVerificationSample(): Record<string, unknown> {
  const dirty = {
    message: "POST failed Authorization Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U",
    request: {
      headers: {
        Authorization: "Bearer secret-jwt-token",
        Cookie: "refresh_token=abc123; session=xyz",
        "Set-Cookie": "token=super-secret",
        "Content-Type": "application/json",
      },
      data: {
        password: "hunter2",
        accessToken: "at_live_123",
        refresh_token: "rt_live_456",
        email: "manager@caretip.de",
      },
    },
    extra: {
      DATABASE_URL: "postgresql://user:pass@host:5432/db",
      STRIPE_SECRET_KEY: "sk_live_abcd1234",
      OPENAI_API_KEY: "sk-abcdefghijklmnopqrstuvwxyz123456",
      RESEND_API_KEY: "re_abcdefghijklmnopqrstuvwxyz",
      SUPABASE_SERVICE_ROLE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig",
      path: "/api/auth/login",
      status: 500,
    },
  };
  return scrubSentryEvent(dirty);
}
