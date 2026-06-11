/**
 * Writes sample transactional email HTML to docs/email-branding-previews/ for visual QA.
 * Run from backend/: node scripts/preview-transactional-emails.mjs
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../../docs/email-branding-previews");

const {
  buildWelcomeEmailContent,
  buildVerifyEmailContent,
  buildPasswordResetContent,
  buildEmployeeActivationContent,
  buildLoginAlertContent,
  buildGenericNotificationContent,
} = await import("../dist/emails/i18nEmail.js");

mkdirSync(outDir, { recursive: true });

const base = "https://caretip.de";

const samples = [
  {
    name: "welcome-en-manager",
    ...buildWelcomeEmailContent({
      locale: "en",
      dashboardUrl: `${base}/dashboard`,
      recipientName: "Max Müller",
      businessName: "CareTip Hospitality",
      accountKind: "manager",
    }),
  },
  {
    name: "welcome-de-employee",
    ...buildWelcomeEmailContent({
      locale: "de",
      dashboardUrl: `${base}/dashboard`,
      recipientName: "Madu Okonkwo",
      businessName: "Riverstone Bistro",
      accountKind: "employee",
    }),
  },
  {
    name: "verify-en",
    ...buildVerifyEmailContent({
      locale: "en",
      verifyUrl: `${base}/verify-email?token=sample`,
      recipientName: "Max",
      businessName: "CareTip Hospitality",
    }),
  },
  {
    name: "password-reset-de",
    ...buildPasswordResetContent({
      locale: "de",
      resetUrl: `${base}/reset-password/sample`,
      recipientName: "Madu",
    }),
  },
  {
    name: "employee-invite-en",
    ...buildEmployeeActivationContent({
      locale: "en",
      businessName: "Riverstone Bistro",
      activationUrl: `${base}/activate?token=sample`,
      recipientName: "Madu",
    }),
  },
  {
    name: "login-alert-en",
    ...buildLoginAlertContent({
      locale: "en",
      when: new Date(),
      locationLabel: "Abuja, Nigeria",
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      recipientName: "Max",
      businessName: "CareTip Hospitality",
      appBaseUrl: base,
      variant: "normal",
    }),
  },
  {
    name: "notification-en",
    ...buildGenericNotificationContent({
      locale: "en",
      title: "New tip received",
      bodyText: "You received a €5.00 tip. Great work!",
      actionUrl: `${base}/dashboard`,
      recipientName: "Madu",
    }),
  },
];

for (const s of samples) {
  writeFileSync(join(outDir, `${s.name}.html`), s.html, "utf8");
  writeFileSync(join(outDir, `${s.name}.txt`), s.text, "utf8");
}

console.log(`Wrote ${samples.length} previews to ${outDir}`);
