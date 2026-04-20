// Caretip password security: Min 8 chars, 1 upper, 1 lower, 1 number, 1 special (@#$%)

export const PASSWORD_CRITERIA = {
  minLength: 8,
  hasUppercase: /[A-Z]/,
  hasLowercase: /[a-z]/,
  hasNumber: /\d/,
  // eslint-disable-next-line no-useless-escape -- explicit escapes for `[` and `/` in password charset
  hasSpecial: /[@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?!~`]/,
} as const;

export type PasswordStrength = "weak" | "fair" | "strong";

export interface PasswordChecklist {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export function getPasswordChecklist(password: string): PasswordChecklist {
  return {
    minLength: password.length >= PASSWORD_CRITERIA.minLength,
    hasUppercase: PASSWORD_CRITERIA.hasUppercase.test(password),
    hasLowercase: PASSWORD_CRITERIA.hasLowercase.test(password),
    hasNumber: PASSWORD_CRITERIA.hasNumber.test(password),
    hasSpecial: PASSWORD_CRITERIA.hasSpecial.test(password),
  };
}

export function isPasswordStrong(password: string): boolean {
  const checklist = getPasswordChecklist(password);
  return Object.values(checklist).every(Boolean);
}

export function getPasswordStrength(password: string): { strength: PasswordStrength; score: number } {
  if (!password) return { strength: "weak", score: 0 };
  const checklist = getPasswordChecklist(password);
  const metCount = Object.values(checklist).filter(Boolean).length;
  const score = (metCount / 5) * 100;

  if (metCount === 5 && password.length >= 10) return { strength: "strong", score: 100 };
  if (metCount === 5) return { strength: "strong", score: 90 };
  if (metCount >= 3) return { strength: "fair", score: Math.max(40, score) };
  return { strength: "weak", score };
}
