import type { TFunction } from "i18next";
import type { InboxNotification } from "./api";

export type NotificationLocaleTemplate = {
  id: string;
  params?: Record<string, unknown>;
};

function parseLocaleTemplate(metadata: Record<string, unknown>): NotificationLocaleTemplate | null {
  const raw = metadata.localeTemplate;
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.id !== "string" || !obj.id.trim()) return null;
  const params =
    obj.params && typeof obj.params === "object" && !Array.isArray(obj.params)
      ? (obj.params as Record<string, unknown>)
      : undefined;
  return { id: obj.id, params };
}

function metaString(meta: Record<string, unknown>, key: string): string | undefined {
  const v = meta[key];
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function metaNumber(meta: Record<string, unknown>, key: string): number | undefined {
  const v = meta[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
}

function parseEuroAmount(text: string): number | undefined {
  const m = text.match(/€\s*([\d.,]+)|([\d.,]+)\s*€/i);
  const raw = (m?.[1] ?? m?.[2])?.trim();
  if (!raw) return undefined;
  const normalized = /,\d{1,2}$/.test(raw) ? raw.replace(/\./g, "").replace(",", ".") : raw.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : undefined;
}

function suffixAfter(message: string, needles: string[]): string | undefined {
  for (const needle of needles) {
    const idx = message.lastIndexOf(needle);
    if (idx >= 0) {
      const rest = message.slice(idx + needle.length).trim();
      if (rest) return rest;
    }
  }
  return undefined;
}

/** Reconstruct template for legacy notifications missing metadata.localeTemplate. */
function inferLocaleTemplate(notification: InboxNotification): NotificationLocaleTemplate | null {
  const meta = notification.metadata ?? {};
  const templateId = metaString(meta, "templateId");
  if (templateId) {
    const params =
      meta.templateParams && typeof meta.templateParams === "object" && !Array.isArray(meta.templateParams)
        ? (meta.templateParams as Record<string, unknown>)
        : undefined;
    return { id: templateId, params };
  }

  const message = notification.message.trim();
  const title = notification.title.trim();
  const url = notification.url ?? metaString(meta, "url");
  const amount =
    metaNumber(meta, "amount") ?? parseEuroAmount(message) ?? parseEuroAmount(title);

  switch (notification.type) {
    case "tip_received": {
      const employeeName = metaString(meta, "employeeName");
      const isBusiness =
        url === "/dashboard" ||
        url === "/dashboard/transactions" ||
        /venue|betrieb/i.test(title) ||
        /\bfor\b/i.test(message) ||
        /\bfür\b/i.test(message);
      if (isBusiness) {
        return {
          id: "tip_received_business",
          params: {
            amount: amount ?? 0,
            employeeName:
              employeeName ?? suffixAfter(message, [" for ", " für "]) ?? "Staff",
          },
        };
      }
      return {
        id: "tip_received_employee",
        params: {
          amount: amount ?? 0,
          name:
            employeeName ??
            suffixAfter(message, [" from ", " von ", " — ", " – ", " - "]) ??
            "Guest",
        },
      };
    }
    case "payout_paid":
      return { id: "payout_completed", params: { amount: amount ?? 0 } };
    case "new_login":
      return { id: "login_security" };
    case "qr_scan":
      return {
        id: "qr_scan",
        params: { place: metaString(meta, "place") ?? suffixAfter(message, [" for ", " für "]) ?? "" },
      };
    case "qr_payment_success":
      return {
        id: "qr_payment_success",
        params: {
          amount: amount ?? 0,
          employeeName: metaString(meta, "employeeName") ?? suffixAfter(message, [" for ", " für "]) ?? "",
        },
      };
    case "support_ticket_created": {
      const ticketNumber = metaString(meta, "ticketNumber");
      if (url?.includes("/platform-admin/") || title.startsWith("[TICKET]")) {
        return {
          id: "support_created_admin",
          params: {
            ticketNumber: ticketNumber ?? "",
            businessName: metaString(meta, "businessName") ?? "",
            category: metaString(meta, "category") ?? "general",
          },
        };
      }
      return {
        id: "support_created_business",
        params: {
          ticketNumber: ticketNumber ?? "",
          subject: metaString(meta, "subject") ?? "",
        },
      };
    }
    case "support_ticket_reply": {
      const ticketNumber = metaString(meta, "ticketNumber") ?? "";
      if (url?.includes("/platform-admin/")) {
        return {
          id: "support_reply_admin",
          params: {
            ticketNumber,
            businessName: metaString(meta, "businessName") ?? "",
            preview: message,
          },
        };
      }
      return { id: "support_reply_business", params: { ticketNumber, preview: message } };
    }
    case "support_ticket_status": {
      const status = metaString(meta, "status")?.toUpperCase();
      if (status === "RESOLVED") return { id: "support_status_resolved" };
      if (status === "CLOSED") return { id: "support_status_closed" };
      return { id: "support_status_updated", params: { status: status ?? "" } };
    }
    default:
      return null;
  }
}

function resolveLocaleTemplate(notification: InboxNotification): NotificationLocaleTemplate | null {
  return parseLocaleTemplate(notification.metadata ?? {}) ?? inferLocaleTemplate(notification);
}

function formatNotificationAmount(amount: unknown, lng: string): string {
  const n = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(n)) return String(amount ?? "");
  return new Intl.NumberFormat(lng.startsWith("de") ? "de-DE" : "en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function categoryLabel(category: unknown, t: TFunction): string {
  const key = typeof category === "string" ? category : "";
  if (!key) return "";
  const label = t(`support.categories.${key}`, { defaultValue: "" });
  return label || key;
}

function statusLabel(status: unknown, t: TFunction): string {
  const key = typeof status === "string" ? status.toUpperCase() : "";
  if (!key) return String(status ?? "");
  const label = t(`support.status.${key}`, { defaultValue: "" });
  return label || key;
}

function renderTemplate(
  template: NotificationLocaleTemplate,
  t: TFunction,
  lng: string,
): { title: string; message: string } | null {
  const p = template.params ?? {};
  const amount = formatNotificationAmount(p.amount, lng);

  switch (template.id) {
    case "tip_received_employee":
      return {
        title: t("notifications.templates.tip_received_employee.title"),
        message: t("notifications.templates.tip_received_employee.body", {
          amount,
          name: String(p.name ?? ""),
        }),
      };
    case "tip_received_business":
      return {
        title: t("notifications.templates.tip_received_business.title"),
        message: t("notifications.templates.tip_received_business.body", {
          amount,
          employeeName: String(p.employeeName ?? ""),
        }),
      };
    case "payout_completed":
      return {
        title: t("notifications.templates.payout_completed.title"),
        message: t("notifications.templates.payout_completed.body", { amount }),
      };
    case "login_security":
      return {
        title: t("notifications.templates.login_security.title"),
        message: t("notifications.templates.login_security.body"),
      };
    case "employee_invited_manager":
      return {
        title: t("notifications.templates.employee_invited_manager.title"),
        message: t("notifications.templates.employee_invited_manager.body", {
          employeeName: String(p.employeeName ?? ""),
          businessName: String(p.businessName ?? ""),
        }),
      };
    case "employee_activated":
      return {
        title: t("notifications.templates.employee_activated.title"),
        message: t("notifications.templates.employee_activated.body", {
          businessName: String(p.businessName ?? ""),
        }),
      };
    case "qr_scan":
      return {
        title: t("notifications.templates.qr_scan.title"),
        message: t("notifications.templates.qr_scan.body", { place: String(p.place ?? "") }),
      };
    case "qr_payment_success":
      return {
        title: t("notifications.templates.qr_payment_success.title"),
        message: t("notifications.templates.qr_payment_success.body", {
          amount,
          employeeName: String(p.employeeName ?? ""),
        }),
      };
    case "verification_document_uploaded":
      return {
        title: t("notifications.templates.verification_document_uploaded.title"),
        message: t("notifications.templates.verification_document_uploaded.body", {
          businessName: String(p.businessName ?? ""),
        }),
      };
    case "business_verification_approved":
      return {
        title: t("notifications.templates.business_verification_approved.title"),
        message: t("notifications.templates.business_verification_approved.body", {
          businessName: String(p.businessName ?? ""),
        }),
      };
    case "business_verification_rejected":
      return {
        title: t("notifications.templates.business_verification_rejected.title"),
        message: t("notifications.templates.business_verification_rejected.body", {
          businessName: String(p.businessName ?? ""),
        }),
      };
    case "support_created_admin":
      return {
        title: t("notifications.templates.support_created_admin.title", {
          ticketNumber: String(p.ticketNumber ?? ""),
        }),
        message: t("notifications.templates.support_created_admin.body", {
          businessName: String(p.businessName ?? ""),
          category: categoryLabel(p.category, t),
        }),
      };
    case "support_created_business":
      return {
        title: t("notifications.templates.support_created_business.title", {
          ticketNumber: String(p.ticketNumber ?? ""),
        }),
        message: t("notifications.templates.support_created_business.body", {
          subject: String(p.subject ?? ""),
        }),
      };
    case "support_reply_admin":
      return {
        title: t("notifications.templates.support_reply_admin.title", {
          ticketNumber: String(p.ticketNumber ?? ""),
        }),
        message: t("notifications.templates.support_reply_admin.body", {
          businessName: String(p.businessName ?? ""),
          preview: String(p.preview ?? ""),
        }),
      };
    case "support_reply_business":
      return {
        title: t("notifications.templates.support_reply_business.title", {
          ticketNumber: String(p.ticketNumber ?? ""),
        }),
        message: String(p.preview ?? ""),
      };
    case "support_status_resolved":
      return {
        title: t("notifications.templates.support_status_resolved.title"),
        message: t("notifications.templates.support_status_resolved.body"),
      };
    case "support_status_closed":
      return {
        title: t("notifications.templates.support_status_closed.title"),
        message: t("notifications.templates.support_status_closed.body"),
      };
    case "support_status_updated":
      return {
        title: t("notifications.templates.support_status_updated.title"),
        message: t("notifications.templates.support_status_updated.body", {
          status: statusLabel(p.status, t),
        }),
      };
    case "support_inbox_title":
      return {
        title: t("notifications.templates.support_inbox_title.title", {
          status: statusLabel(p.status, t),
          ticketNumber: String(p.ticketNumber ?? ""),
          subject: String(p.subject ?? ""),
        }),
        message: "",
      };
    default:
      return null;
  }
}

/** Re-render inbox title/message from stored localeTemplate + current UI language. */
export function localizeInboxNotification(
  notification: InboxNotification,
  t: TFunction,
  lng: string,
): InboxNotification {
  const template = resolveLocaleTemplate(notification);
  if (!template) return notification;
  const rendered = renderTemplate(template, t, lng);
  if (!rendered) return notification;
  return {
    ...notification,
    title: rendered.title || notification.title,
    message: rendered.message || notification.message,
  };
}

export function localizeInboxNotifications(
  items: InboxNotification[],
  t: TFunction,
  lng: string,
): InboxNotification[] {
  return items.map((n) => localizeInboxNotification(n, t, lng));
}
