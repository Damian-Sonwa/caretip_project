import { prisma } from "../../prisma.js";
import type { NewTipPayload } from "../../socket/emitTip.js";
import { logPush } from "./pushSend.js";
import { NotificationType } from "./notification.types.js";
import {
  deliverNotificationToUsers,
  deliverUserNotification,
} from "../notifications/notificationOrchestrator.service.js";

function safeTrigger(label: string, fn: () => Promise<void>): void {
  void fn().catch((err) => {
    logPush("error", `${label} failed`, {
      message: err instanceof Error ? err.message : String(err),
    });
  });
}

export async function listPlatformAdminUserIds(): Promise<string[]> {
  const rows = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN", isPlatformAdmin: true, isActive: true },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}

/** 1. New tip received — employee + business manager. */
export function onTipReceived(payload: NewTipPayload): void {
  safeTrigger("onTipReceived", async () => {
    const employee = await prisma.employee.findUnique({
      where: { id: payload.employeeId },
      select: { userId: true, name: true },
    });
    if (!employee) return;

    const ts = new Date().toISOString();
    const amount = Number(payload.tip.amount);

    await deliverUserNotification({
      userId: employee.userId,
      payload: {
        type: NotificationType.TIP_RECEIVED,
        title: "New tip received",
        body: "",
        localeTemplate: {
          id: "tip_received_employee",
          params: {
            amount,
            name: employee.name,
          },
        },
        url: "/employee/notifications",
        timestamp: ts,
        metadata: {
          entityId: payload.tip.id,
          tipId: payload.tip.id,
          employeeId: payload.employeeId,
          businessId: payload.businessId,
        },
      },
      dedupeKey: `tip:${payload.tip.id}:employee:${employee.userId}`,
    });

    const business = await prisma.business.findUnique({
      where: { id: payload.businessId },
      select: { userId: true },
    });
    if (business?.userId && business.userId !== employee.userId) {
      await deliverUserNotification({
        userId: business.userId,
        payload: {
          type: NotificationType.TIP_RECEIVED,
          title: "New tip at your venue",
          body: "",
          localeTemplate: {
            id: "tip_received_business",
            params: {
              amount,
              employeeName: employee.name,
            },
          },
          url: "/dashboard",
          timestamp: ts,
          metadata: {
            entityId: payload.tip.id,
            tipId: payload.tip.id,
            employeeId: payload.employeeId,
            businessId: payload.businessId,
          },
        },
        dedupeKey: `tip:${payload.tip.id}:business:${business.userId}`,
      });
    }
  });
}

/** 2. Payout completed — employee (or manager when applicable). */
export function onPayoutCompleted(
  userId: string,
  amount: number,
  transactionId: string,
): void {
  safeTrigger("onPayoutCompleted", async () => {
    await deliverUserNotification({
      userId,
      payload: {
        type: NotificationType.PAYOUT_COMPLETED,
        title: "Payout completed",
        body: "",
        localeTemplate: {
          id: "payout_completed",
          params: { amount },
        },
        timestamp: new Date().toISOString(),
        metadata: { entityId: transactionId, transactionId, payoutStatus: "paid" },
      },
      dedupeKey: `payout:${transactionId}:${userId}`,
    });
  });
}

export function onPayoutCompletedForTransaction(transactionId: string): void {
  safeTrigger("onPayoutCompletedForTransaction", async () => {
    const tx = await prisma.transaction.findUnique({
      where: { id: transactionId },
      select: {
        payoutStatus: true,
        amount: true,
        employee: { select: { userId: true } },
      },
    });
    if (!tx || tx.payoutStatus !== "paid" || !tx.employee?.userId) return;
    onPayoutCompleted(tx.employee.userId, Number(tx.amount), transactionId);
  });
}

/** 3. Login / security alert. */
export function onLoginSecurityAlert(userId: string): void {
  safeTrigger("onLoginSecurityAlert", async () => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    const url =
      user?.role === "MANAGER" ? "/dashboard/settings" : "/employee/settings";

    await deliverUserNotification({
      userId,
      payload: {
        type: NotificationType.LOGIN_SECURITY,
        title: "New sign-in",
        body: "",
        localeTemplate: { id: "login_security" },
        url,
        timestamp: new Date().toISOString(),
        metadata: { entityId: userId },
      },
      dedupeKey: `login:${userId}:${new Date().toISOString().slice(0, 13)}`,
      channels: { in_app: true, push: true, email: true },
    });
  });
}

/** 4a. Manager notified when a team member is invited. */
export function onEmployeeInvited(params: {
  businessId: string;
  employeeName: string;
  employeeEmail: string;
}): void {
  safeTrigger("onEmployeeInvited", async () => {
    const business = await prisma.business.findUnique({
      where: { id: params.businessId },
      select: { userId: true, name: true },
    });
    if (!business?.userId) return;

    await deliverUserNotification({
      userId: business.userId,
      payload: {
        type: NotificationType.EMPLOYEE_INVITED,
        title: "Team invitation sent",
        body: "",
        localeTemplate: {
          id: "employee_invited_manager",
          params: {
            employeeName: params.employeeName,
            businessName: business.name,
          },
        },
        url: "/dashboard/staff-management",
        timestamp: new Date().toISOString(),
        metadata: {
          entityId: params.employeeEmail,
          businessId: params.businessId,
        },
      },
      dedupeKey: `invite:${params.businessId}:${params.employeeEmail}`,
    });
  });
}

/** 4b. Employee welcomed when activation completes. */
export function onEmployeeAccountActivated(userId: string, businessName: string): void {
  safeTrigger("onEmployeeAccountActivated", async () => {
    await deliverUserNotification({
      userId,
      payload: {
        type: NotificationType.EMPLOYEE_INVITED,
        title: "Welcome to CareTip",
        body: "",
        localeTemplate: {
          id: "employee_activated",
          params: { businessName },
        },
        timestamp: new Date().toISOString(),
        metadata: { entityId: userId },
      },
      dedupeKey: `activated:${userId}`,
    });
  });
}

/** 5. QR scan — manager notified when a guest opens a tipping QR page. */
export function onQrScanActivity(params: {
  businessId: string;
  locationName?: string;
  tableName?: string;
  qrSlug?: string;
}): void {
  safeTrigger("onQrScanActivity", async () => {
    const business = await prisma.business.findUnique({
      where: { id: params.businessId },
      select: { userId: true, name: true },
    });
    if (!business?.userId) return;

    const place =
      params.tableName && params.locationName
        ? `${params.tableName} (${params.locationName})`
        : params.locationName ?? params.tableName ?? "your venue";

    const dedupeSlug = params.qrSlug ?? params.tableName ?? params.businessId;

    await deliverUserNotification({
      userId: business.userId,
      payload: {
        type: NotificationType.QR_SCAN,
        title: "QR code scanned",
        body: "",
        localeTemplate: { id: "qr_scan", params: { place } },
        url: "/dashboard",
        timestamp: new Date().toISOString(),
        metadata: {
          entityId: dedupeSlug,
          businessId: params.businessId,
        },
      },
      dedupeKey: `qr_scan:${params.businessId}:${dedupeSlug}`,
    });
  });
}

/** 6. QR payment successful — manager-only supplement (tip event still fires for full detail). */
export function onQrPaymentSuccessful(params: {
  businessId: string;
  amount: number;
  transactionId: string;
  employeeName: string;
}): void {
  safeTrigger("onQrPaymentSuccessful", async () => {
    const business = await prisma.business.findUnique({
      where: { id: params.businessId },
      select: { userId: true },
    });
    if (!business?.userId) return;

    await deliverUserNotification({
      userId: business.userId,
      payload: {
        type: NotificationType.QR_PAYMENT_SUCCESS,
        title: "QR payment received",
        body: "",
        localeTemplate: {
          id: "qr_payment_success",
          params: {
            amount: params.amount,
            employeeName: params.employeeName,
          },
        },
        url: "/dashboard",
        timestamp: new Date().toISOString(),
        metadata: {
          entityId: params.transactionId,
          transactionId: params.transactionId,
          businessId: params.businessId,
        },
      },
      dedupeKey: `qr_pay:${params.transactionId}:${business.userId}`,
    });
  });
}

/** Platform operator alert — all active platform admins (verification queue, ops). */
export function onPlatformOperationalAlert(params: {
  title: string;
  body: string;
  url?: string;
  entityId?: string;
  localeTemplate?: import("../../notifications/notificationI18n.js").NotificationTemplate;
}): void {
  safeTrigger("onPlatformOperationalAlert", async () => {
    const adminIds = await listPlatformAdminUserIds();
    if (adminIds.length === 0) return;
    const entityId = params.entityId ?? params.title;
    await deliverNotificationToUsers(
      adminIds,
      {
        type: NotificationType.SYSTEM_ALERT,
        title: params.title,
        body: params.body,
        localeTemplate: params.localeTemplate,
        url: params.url ?? "/platform-admin/businesses",
        timestamp: new Date().toISOString(),
        metadata: { entityId },
      },
      { dedupeKeyPrefix: `platform_op:${entityId}` },
    );
  });
}

/** Manager uploaded or updated KYC verification documents. */
export function onBusinessVerificationDocumentUploaded(
  businessId: string,
  businessName: string,
): void {
  onPlatformOperationalAlert({
    title: "Verification document uploaded",
    body: "",
    localeTemplate: {
      id: "verification_document_uploaded",
      params: { businessName },
    },
    url: `/platform-admin/businesses/${businessId}`,
    entityId: `verification_doc:${businessId}`,
  });
}

/** 7. Admin announcement — targeted users (managers/employees). */
export function onAdminAnnouncement(params: {
  userIds: string[];
  title: string;
  body: string;
  url?: string;
  announcementId?: string;
}): void {
  safeTrigger("onAdminAnnouncement", async () => {
    const id = params.announcementId ?? `announcement:${Date.now()}`;
    await deliverNotificationToUsers(
      params.userIds,
      {
        type: NotificationType.ADMIN_ANNOUNCEMENT,
        title: params.title,
        body: params.body,
        url: params.url,
        timestamp: new Date().toISOString(),
        metadata: { entityId: id },
      },
      { dedupeKeyPrefix: `admin:${id}` },
    );
  });
}

/** Generic system alert (replaces legacy notifySystemAlertPush). */
export function onSystemAlert(userId: string, title: string, body: string, url?: string): void {
  safeTrigger("onSystemAlert", async () => {
    await deliverUserNotification({
      userId,
      payload: {
        type: NotificationType.SYSTEM_ALERT,
        title,
        body,
        url,
        timestamp: new Date().toISOString(),
      },
    });
  });
}

// —— Legacy export names (call sites keep stable imports) ——

export const notifyTipReceivedPush = onTipReceived;
export const notifyNewLoginPush = onLoginSecurityAlert;
export const notifyPayoutPaidPush = onPayoutCompleted;
export const notifyPayoutPaidForTransaction = onPayoutCompletedForTransaction;
export const notifySystemAlertPush = onSystemAlert;
