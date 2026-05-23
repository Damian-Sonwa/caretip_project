/**
 * Push module facade — token registry, FCM config, and notification triggers.
 * Prefer importing from `./notification.triggers.js` or `./notification.service.js` in new code.
 */

export {
  getPublicFirebaseWebConfig,
  registerPushDeviceToken,
  removePushDeviceToken,
  removeAllPushDeviceTokensForUser,
  listPushTokensForUser,
} from "./deviceTokens.service.js";

export {
  NotificationType,
  type NotificationPayload,
  type SendNotificationResult,
  type SendNotificationBatchResult,
} from "./notification.types.js";

export { sendNotification, sendNotificationToUsers } from "./notification.service.js";

export {
  onTipReceived,
  onPayoutCompleted,
  onPayoutCompletedForTransaction,
  onLoginSecurityAlert,
  onEmployeeInvited,
  onEmployeeAccountActivated,
  onQrScanActivity,
  onQrPaymentSuccessful,
  onAdminAnnouncement,
  onPlatformOperationalAlert,
  onBusinessVerificationDocumentUploaded,
  listPlatformAdminUserIds,
  onSystemAlert,
  notifyTipReceivedPush,
  notifyNewLoginPush,
  notifyPayoutPaidPush,
  notifyPayoutPaidForTransaction,
  notifySystemAlertPush,
} from "./notification.triggers.js";

import { isFcmConfigured } from "./fcmAdmin.js";
import { listPushTokensForUser } from "./deviceTokens.service.js";
import { sendNotification } from "./notification.service.js";
import { NotificationType } from "./notification.types.js";

export type SendTestPushResult = {
  sent: boolean;
  successCount: number;
  failureCount: number;
  tokenCount: number;
  message: string;
};

/** Dev-only test send (bypasses preferences). */
export async function sendTestPushToUser(userId: string): Promise<SendTestPushResult> {
  const tokens = await listPushTokensForUser(userId);
  if (tokens.length === 0) {
    return {
      sent: false,
      successCount: 0,
      failureCount: 0,
      tokenCount: 0,
      message: "No device tokens registered. Enable push and allow browser notifications first.",
    };
  }
  if (!isFcmConfigured()) {
    return {
      sent: false,
      successCount: 0,
      failureCount: 0,
      tokenCount: tokens.length,
      message: "FCM is not configured on the server.",
    };
  }

  const result = await sendNotification(
    userId,
    {
      type: NotificationType.SYSTEM_ALERT,
      title: "CareTip test",
      body: "Push notifications are working.",
      url: "/dashboard/settings",
      metadata: { type: "test", entityId: "test" },
    },
    { bypassPreferences: true, dedupeKey: `test:${userId}:${Date.now()}` },
  );

  if (result.skipped && result.skipReason === "fcm_unconfigured") {
    return {
      sent: false,
      successCount: 0,
      failureCount: tokens.length,
      tokenCount: tokens.length,
      message: "Firebase Admin failed to initialize.",
    };
  }

  const sent = result.successCount > 0;
  return {
    sent,
    successCount: result.successCount,
    failureCount: result.failureCount,
    tokenCount: result.tokenCount,
    message: sent
      ? `Test notification sent to ${result.successCount} device(s).`
      : "Failed to deliver to any registered device.",
  };
}
