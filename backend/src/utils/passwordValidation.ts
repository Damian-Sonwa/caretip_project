// Caretip password security: Min 8 chars, 1 upper, 1 lower, 1 number, 1 special (@#$%)

const MIN_LENGTH = 8;
const HAS_UPPERCASE = /[A-Z]/;
const HAS_LOWERCASE = /[a-z]/;
const HAS_NUMBER = /\d/;
const HAS_SPECIAL = /[@#$%^&*()_+\-=[\]{};':"\\|,.<>/?!~`]/;

export interface PasswordValidationResult {
  valid: boolean;
  message?: string;
}

export function validatePassword(password: string): PasswordValidationResult {
  if (!password || typeof password !== "string") {
    return { valid: false, message: "Password is required" };
  }
  if (password.length < MIN_LENGTH) {
    return { valid: false, message: "Password must be at least 8 characters" };
  }
  if (!HAS_UPPERCASE.test(password)) {
    return { valid: false, message: "Password must contain at least one uppercase letter" };
  }
  if (!HAS_LOWERCASE.test(password)) {
    return { valid: false, message: "Password must contain at least one lowercase letter" };
  }
  if (!HAS_NUMBER.test(password)) {
    return { valid: false, message: "Password must contain at least one number" };
  }
  if (!HAS_SPECIAL.test(password)) {
    return {
      valid: false,
      message: "Password must contain at least one special character (e.g. @, #, $, %)",
    };
  }
  return { valid: true };
}
