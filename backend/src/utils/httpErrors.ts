import { Prisma } from "@prisma/client";

/** Messages intentionally thrown from services for end users (never stack traces / DB internals). */
const ALLOWED_CLIENT_MESSAGES = new Set<string>([
  // Validation
  "Email and password are required",
  "Current and new password are required",
  "Business name is required",
  "Name is required",
  "Invite code is required",
  "Invalid role. Use 'business' or 'employee'",
  "intendedRole is required and must be 'business' or 'employee'",
  "Monthly goal must be a non-negative number",
  "Image file is required (field name: avatar)",
  "Photo upload is not configured on this server. The administrator should set CLOUDINARY_URL (recommended) or PUBLIC_API_BASE_URL to the API’s public HTTPS URL.",
  "businessId is required",
  "Employee ID is required",
  "amount, employeeId, and businessId are required",
  "Invalid amount",
  "Slug is required",
  // Password rules (passwordValidation.ts)
  "Password is required",
  "Password must be at least 8 characters",
  "Password must contain at least one uppercase letter",
  "Password must contain at least one lowercase letter",
  "Password must contain at least one number",
  "Password must contain at least one special character (e.g. @, #, $, %)",
  // Auth service
  "Email already registered",
  "Invalid or expired invite code",
  "Invalid email or password",
  "This account does not have Business permissions.",
  "This account does not have Staff permissions.",
  "Current password is incorrect",
  // Business / staff
  "Business not found",
  "Profile not found",
  "Staff member not found",
  "Employee not found",
  "Only business owners can add employees",
  "Only business owners can update employees",
  "Only business owners can remove employees",
  "Failed to generate invite code.",
  "Name cannot be empty",
  "Email already in use",
  "Name, email, and role are required",
  "Invalid location",
  "One or more tables are invalid",
  "Table does not belong to this business",
  "Selected tables must belong to a single location",
  "Selected tables must belong to the assigned location",
  "Not allowed",
  // Locations / tables (venue QR)
  "Location name is required",
  "Table name is required",
  "name and locationId are required",
  "name is required",
  "Location not found",
  "Table not found",
  "Stripe payment processing is not configured",
  "Invalid amount or business context",
  "Invalid tip amount",
  "Amount too small",
  "Payment provider could not start checkout",
  "This QR slug is already in use",
  "Could not generate a unique QR slug",
  "qrSlug must be 3–128 characters: letters, numbers, hyphens, underscores",
  "QR code will be available after business verification.",
  "QR code generation will be enabled after admin verification.",
  // Auth middleware (already safe)
  "Authentication required",
  "Invalid or expired token",
  "Insufficient permissions",
  "Email verification required",
  "Email is not verified.",
  "Account pending verification.",
]);

export function logServerError(context: string, err: unknown): void {
  console.error(`[${context}]`, err);
  if (err instanceof Error && err.stack) {
    console.error(err.stack);
  }
}

function prismaClientMessage(err: unknown): string | null {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return "This email is already in use. Try signing in or use a different email.";
    }
    if (err.code === "P2025") {
      return "We couldn't find that record. It may have been removed.";
    }
    if (err.code === "P2003") {
      return "This action couldn't be completed because related data is missing.";
    }
    if (err.code === "P2014") {
      return "This action couldn't be completed due to related records.";
    }
    if (err.code === "P2022") {
      return "The database is missing required columns. From the backend folder, run: npm run db:migrate:deploy";
    }
    if (err.code === "P2021") {
      return "A required table is missing (often the staff–table join `_EmployeeTableAssignments`). Run: npm run db:migrate:deploy in backend.";
    }
    return null;
  }
  return null;
}

/**
 * Returns a message safe to send in JSON `{ message }` or a generic fallback.
 * Always call {@link logServerError} first when handling unexpected errors.
 */
export function clientSafeMessage(err: unknown, fallback: string): string {
  const prismaMsg = prismaClientMessage(err);
  if (prismaMsg) return prismaMsg;

  if (err instanceof Prisma.PrismaClientValidationError) {
    return "Invalid data. Check location and table assignments, or run backend migrations (npm run db:migrate:deploy).";
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return `Could not save (${err.code}). Try again or run migrations in the backend.`;
  }
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    return "Database error. Confirm migrations are applied (npm run db:migrate:deploy in backend).";
  }
  if (err instanceof Prisma.PrismaClientInitializationError) {
    return "Database connection failed. Check DATABASE_URL and that PostgreSQL is reachable.";
  }
  if (err instanceof Prisma.PrismaClientRustPanicError) {
    return fallback;
  }

  const msg = err instanceof Error ? err.message : "";
  if (msg && ALLOWED_CLIENT_MESSAGES.has(msg)) {
    return msg;
  }
  return fallback;
}

export const CLIENT_FALLBACK = {
  /** Only when the error cannot be classified — prefer domain-specific fallbacks below. */
  generic: "Something went wrong. Please try again later.",
  register: "We couldn't create your account. Please try again.",
  loginUnexpected: "Sign-in is temporarily unavailable. Please try again in a few moments.",
  changePassword: "We couldn't update your password. Please try again.",
  business: "We couldn't save your venue or team data. Please try again.",
  employee: "We couldn't update staff or your profile. Please try again.",
  staff: "We couldn't load this team member or directory. Please try again.",
  tips: "We couldn't process your tip. Please try again.",
  exportCsv: "We couldn't export your data. Please try again.",
  payment: "We couldn't start the payment. Please try again.",
  tipFeedback: "We couldn't save your feedback. Please try again.",
} as const;
