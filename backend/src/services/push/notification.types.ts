/** Production push notification categories (FCM data `event` field). */
export const NotificationType = {
  TIP_RECEIVED: "tip_received",
  PAYOUT_COMPLETED: "payout_paid",
  LOGIN_SECURITY: "new_login",
  EMPLOYEE_INVITED: "employee_invited",
  QR_SCAN: "qr_scan",
  QR_PAYMENT_SUCCESS: "qr_payment_success",
  ADMIN_ANNOUNCEMENT: "admin_announcement",
  SYSTEM_ALERT: "system_alert",
  SUPPORT_TICKET_CREATED: "support_ticket_created",
  SUPPORT_TICKET_REPLY: "support_ticket_reply",
  SUPPORT_TICKET_STATUS: "support_ticket_status",
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

export type NotificationContent = {
  title: string;
  body: string;
};

export type NotificationPayload = {
  type: NotificationType;
  title: string;
  body: string;
  /** In-app route when the user opens the notification. */
  url?: string;
  /** ISO-8601 timestamp included in FCM data payload. */
  timestamp?: string;
  /** Extra string metadata (FCM data fields must be strings). */
  metadata?: Record<string, string>;
};

export type SendNotificationOptions = {
  /** Skip preference checks (tests / critical security only). */
  bypassPreferences?: boolean;
  /** Prevent duplicate sends within the dedupe window (default 60s). */
  dedupeKey?: string;
};

export type SendNotificationResult = {
  userId: string;
  type: NotificationType;
  skipped: boolean;
  skipReason?: "preferences" | "no_tokens" | "duplicate" | "fcm_unconfigured";
  tokenCount: number;
  successCount: number;
  failureCount: number;
};

export type SendNotificationBatchResult = {
  results: SendNotificationResult[];
  totalSuccess: number;
  totalFailure: number;
};
