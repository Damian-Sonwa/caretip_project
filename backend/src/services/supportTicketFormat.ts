import type { SupportTicketCategory, SupportTicketStatus } from "@prisma/client";
import type { EmailLocale } from "../emails/i18nEmail.js";

export function categoryLabel(category: SupportTicketCategory): string {
  return categoryLabelLocalized(category, "en");
}

export function categoryLabelLocalized(
  category: SupportTicketCategory,
  locale: EmailLocale,
): string {
  const de = locale === "de";
  const mapEn: Record<SupportTicketCategory, string> = {
    technical: "Technical Issue",
    billing: "Billing",
    kyc: "KYC",
    feature_request: "Feature Request",
    general: "General Inquiry",
  };
  const mapDe: Record<SupportTicketCategory, string> = {
    technical: "Technisches Problem",
    billing: "Abrechnung",
    kyc: "KYC",
    feature_request: "Funktionswunsch",
    general: "Allgemeine Anfrage",
  };
  const map = de ? mapDe : mapEn;
  return map[category] ?? category;
}

export function statusBadge(status: SupportTicketStatus): string {
  return `[${status}]`;
}

export function inboxTitleForSupportTicket(params: {
  ticketNumber: string;
  status: SupportTicketStatus;
  subject: string;
}): string {
  return `[TICKET] ${statusBadge(params.status)} ${params.ticketNumber}: ${params.subject}`;
}
