function getFrontendBaseUrl(): string {
  const u = process.env.FRONTEND_URL?.trim();
  if (u) return u.replace(/\/$/, "");
  return "http://localhost:5173";
}

export function buildEmployeeActivationUrl(rawToken: string): string {
  const token = String(rawToken ?? "").trim();
  return `${getFrontendBaseUrl()}/activate?token=${encodeURIComponent(token)}`;
}

export async function sendEmployeeActivationEmail(input: {
  to: string;
  employeeName?: string;
  activationUrl: string;
  expiresInHours?: number;
}): Promise<void> {
  const to = input.to.trim().toLowerCase();
  const activationUrl = input.activationUrl;
  const expiresInHours = input.expiresInHours ?? 24;

  if (!to) return;

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim() ?? "CareTip <onboarding@resend.dev>";

  const subject = "You're invited to join CareTip";
  const greetingName = input.employeeName?.trim() ? input.employeeName.trim() : "there";

  const html = `
    <div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji'; line-height: 1.5; color: #0f172a;">
      <p>Hi ${escapeHtml(greetingName)},</p>
      <p>Welcome to CareTip. You’ve been invited to join your team.</p>
      <p style="margin: 24px 0;">
        <a href="${activationUrl}" style="display: inline-block; background: #197278; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 8px; font-weight: 600;">
          Set your password
        </a>
      </p>
      <p>This link expires in ${expiresInHours} hours.</p>
      <p style="font-size: 12px; color: #475569;">If the button doesn’t work, copy and paste this link into your browser:<br/>${activationUrl}</p>
    </div>
  `.trim();

  const text = `Hi ${greetingName},

Welcome to CareTip. You’ve been invited to join your team.

Set your password: ${activationUrl}

This link expires in ${expiresInHours} hours.`;

  if (resendKey) {
    try {
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          html,
          text,
        }),
      });
      if (!r.ok) {
        const t = await r.text();
        console.error("[employee-activation] Resend error", r.status, t.slice(0, 500));
      }
    } catch (e) {
      console.error("[employee-activation] Resend request failed", e);
    }
  } else if (process.env.NODE_ENV !== "production") {
    console.info(
      "[employee-activation] (dev) Activation link — configure RESEND_API_KEY to send email:",
      activationUrl
    );
  } else {
    console.warn("[employee-activation] RESEND_API_KEY not set; activation email was not sent.");
  }
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

