/**
 * Verifies AuthBackToHomeNav is wired through shared auth layouts.
 * Usage: node scripts/audit-auth-back-to-home.mjs
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

const layoutFiles = [
  "src/app/components/auth/AuthSplitLayout.tsx",
  "src/app/pages/platform/PlatformAdminLoginPage.tsx",
];

const authPages = [
  "src/app/components/AuthPage.tsx",
  "src/app/pages/JoinPage.tsx",
  "src/app/pages/ForgotPasswordPage.tsx",
  "src/app/pages/ResetPasswordPage.tsx",
  "src/app/pages/CheckEmailPage.tsx",
  "src/app/pages/ActivateEmployeePage.tsx",
  "src/app/components/auth/EmailVerificationSuccessScreen.tsx",
];

let ok = true;

for (const file of layoutFiles) {
  const src = readFileSync(join(root, file), "utf8");
  if (!src.includes("AuthBackToHomeNav")) {
    console.error(`MISSING AuthBackToHomeNav in ${file}`);
    ok = false;
  }
}

for (const file of authPages) {
  const src = readFileSync(join(root, file), "utf8");
  if (!src.includes("AuthSplitLayout") && !src.includes("AuthRecoveryLayout") && !src.includes("SignInCard2")) {
    console.error(`WARN: ${file} may not use shared auth layout`);
  }
}

if (ok) {
  console.log("PASS: AuthBackToHomeNav present in shared auth shells.");
  process.exit(0);
}

process.exit(1);
