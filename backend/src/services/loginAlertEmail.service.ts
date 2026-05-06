import { getResendFromAddress, sendResendEmail } from "./resendClient.js";

export async function sendNewLoginAlertEmail(input: {
  to: string;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<void> {
  const to = input.to.trim().toLowerCase();
  if (!to) return;

  const from = getResendFromAddress();
  const when = new Date().toLocaleString();
  const ip = input.ip?.trim() || "Unknown";
  const ua = input.userAgent?.trim() || "Unknown device";

  const subject = "New login to your CareTip account";
  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; line-height: 1.5; color: #0f172a;">
      <p>We detected a new login to your CareTip account.</p>
      <div style="margin: 16px 0; padding: 12px 14px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <p style="margin: 0;"><strong>Time:</strong> ${when}</p>
        <p style="margin: 6px 0 0;"><strong>IP:</strong> ${ip}</p>
        <p style="margin: 6px 0 0;"><strong>Device:</strong> ${ua}</p>
      </div>
      <p style="margin-top: 18px; font-size: 12px; color: #475569;">
        If this was you, you can ignore this email. If not, change your password immediately.
      </p>
    </div>
  `.trim();

  const text = `We detected a new login to your CareTip account.

Time: ${when}
IP: ${ip}
Device: ${ua}

If this wasn't you, change your password immediately.`;

  const ok = await sendResendEmail("login-alert", { from, to: [to], subject, html, text });
  if (!ok && process.env.NODE_ENV !== "production") {
    console.info("[login-alert] (dev) Would send new-login alert to:", to);
  }
}

