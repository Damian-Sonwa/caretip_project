/**
 * Persists validated employee invite context across refresh and OAuth within the tab session.
 */

export type ValidatedInviteContext = {
  inviteCode: string;
  businessName?: string;
  businessId?: string;
  businessSlug?: string;
  businessLocation?: string | null;
  validatedAt: number;
};

const STORAGE_KEY = "caretip_validated_invite_v1";

export function saveValidatedInviteContext(
  ctx: Omit<ValidatedInviteContext, "validatedAt">,
): ValidatedInviteContext {
  const payload: ValidatedInviteContext = { ...ctx, validatedAt: Date.now() };
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / private mode
  }
  return payload;
}

export function readValidatedInviteContext(): ValidatedInviteContext | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ValidatedInviteContext;
    if (!parsed?.inviteCode?.trim()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearValidatedInviteContext(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
