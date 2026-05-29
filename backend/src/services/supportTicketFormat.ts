import type { SupportTicketCategory, SupportTicketStatus } from "@prisma/client";

export function categoryLabel(category: SupportTicketCategory): string {
  const map: Record<SupportTicketCategory, string> = {
    technical: "Technical Issue",
    billing: "Billing",
    kyc: "KYC",
    feature_request: "Feature Request",
    general: "General Inquiry",
  };
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
