export const EMAIL_NOT_VERIFIED_CODE = "EMAIL_NOT_VERIFIED" as const;

/** Returned with 400 from POST /api/auth/oauth when Google login finds no CareTip user for that email. */
export const GOOGLE_ACCOUNT_NOT_REGISTERED_CODE = "GOOGLE_ACCOUNT_NOT_REGISTERED" as const;

/** Structured API failure from {@link apiRequest} / {@link handleRes} when the server returns JSON with `code`. */
export class ApiRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly canResend?: boolean
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

export function isApiRequestError(e: unknown): e is ApiRequestError {
  return e instanceof ApiRequestError;
}
