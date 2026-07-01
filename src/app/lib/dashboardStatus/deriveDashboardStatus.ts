import type { TFunction } from "i18next";
import type { SocketConnectionStatus } from "../../hooks/useSocket";
import type { DashboardStatusItem } from "./types";

function isSocketConnecting(status: SocketConnectionStatus | undefined): boolean {
  return status === "connecting" || status === "reconnecting";
}

/** Connection badge only when degraded — healthy connected state shows no badge. */
function deriveConnectionStatusItem(
  socketStatus: SocketConnectionStatus,
  t: TFunction,
): DashboardStatusItem | null {
  if (isSocketConnecting(socketStatus)) {
    return {
      id: "connection",
      tone: "updating",
      label: t("dashboard.status.realtimeConnecting"),
      description: t("dashboard.status.realtimeConnectingDesc"),
    };
  }
  if (socketStatus === "disconnected") {
    return {
      id: "connection",
      tone: "action",
      label: t("dashboard.status.connectionOffline"),
      description: t("dashboard.status.connectionOfflineDesc"),
    };
  }
  return null;
}

function deriveSyncStatusItem(
  isRefreshing: boolean,
  t: TFunction,
  updatingDescKey: string,
  upToDateDescKey: string,
): DashboardStatusItem {
  if (isRefreshing) {
    return {
      id: "sync",
      tone: "updating",
      label: t("dashboard.status.updating"),
      description: t(updatingDescKey),
    };
  }
  return {
    id: "sync",
    tone: "live",
    label: t("dashboard.status.dataUpToDate"),
    description: t(upToDateDescKey),
  };
}

export function deriveBusinessDashboardStatus(
  input: {
    isInitialLoading: boolean;
    isPeriodRefreshing: boolean;
    pendingVerification: boolean;
    platformAccessApproved?: boolean;
    statsLoadFailed: string | null;
    socketStatus: SocketConnectionStatus;
  },
  t: TFunction,
): DashboardStatusItem[] {
  if (input.isInitialLoading) return [];

  const items: DashboardStatusItem[] = [];

  if (input.statsLoadFailed) {
    items.push({
      id: "data-action",
      tone: "action",
      label: t("dashboard.status.actionRequired"),
      description: t("dashboard.status.dataLoadFailed"),
    });
    return items;
  }

  const platformApproved = input.platformAccessApproved !== false;
  items.push({
    id: "platform-access",
    tone: platformApproved ? "live" : "updating",
    label: platformApproved
      ? t("dashboard.status.platformAccessApproved")
      : t("dashboard.status.platformAccessPending"),
    description: platformApproved
      ? t("dashboard.status.platformAccessApprovedDesc")
      : t("dashboard.status.platformAccessPendingDesc"),
  });

  const connection = deriveConnectionStatusItem(input.socketStatus, t);
  if (connection) items.push(connection);

  items.push(
    deriveSyncStatusItem(
      input.isPeriodRefreshing,
      t,
      "dashboard.status.businessUpdatingDesc",
      "dashboard.status.businessLiveDesc",
    ),
  );

  return items;
}

export function deriveEmployeeDashboardStatus(
  input: {
    isInitialLoading: boolean;
    isPeriodRefreshing: boolean;
    socketStatus: SocketConnectionStatus;
  },
  t: TFunction,
): DashboardStatusItem[] {
  if (input.isInitialLoading) return [];

  const items: DashboardStatusItem[] = [];

  const connection = deriveConnectionStatusItem(input.socketStatus, t);
  if (connection) items.push(connection);

  items.push(
    deriveSyncStatusItem(
      input.isPeriodRefreshing,
      t,
      "dashboard.status.employeeUpdatingDesc",
      "dashboard.status.employeeDataUpToDateDesc",
    ),
  );

  return items;
}

export function derivePlatformAdminDashboardStatus(
  input: {
    isInitialLoading: boolean;
    isSyncing: boolean;
    analyticsSyncing: boolean;
    serviceIssue: string | null;
    socketStatus: SocketConnectionStatus;
    pendingVerificationCount?: number;
  },
  t: TFunction,
): DashboardStatusItem[] {
  if (input.isInitialLoading) return [];

  const items: DashboardStatusItem[] = [];

  if (input.serviceIssue) {
    items.push({
      id: "data-action",
      tone: "action",
      label: t("dashboard.status.actionRequired"),
      description: input.serviceIssue,
    });
    return items;
  }

  if ((input.pendingVerificationCount ?? 0) > 0) {
    items.push({
      id: "verification-queue",
      tone: "updating",
      label: t("dashboard.status.adminVerificationQueue"),
      description: t("dashboard.status.adminVerificationQueueDesc", {
        count: input.pendingVerificationCount,
      }),
    });
  }

  const connection = deriveConnectionStatusItem(input.socketStatus, t);
  if (connection) items.push(connection);

  items.push(
    deriveSyncStatusItem(
      input.isSyncing || input.analyticsSyncing,
      t,
      "dashboard.status.adminUpdatingDesc",
      "dashboard.status.adminDataUpToDateDesc",
    ),
  );

  return items;
}

/** Future-proof: map support ticket status when passed from inbox/summary state. */
export function deriveSupportTicketStatusItem(
  status: "OPEN" | "PENDING" | "RESOLVED" | "CLOSED" | string | undefined,
  t: TFunction,
): DashboardStatusItem | null {
  if (!status) return null;
  const normalized = status.toUpperCase();
  if (normalized === "OPEN" || normalized === "PENDING") {
    return {
      id: "support-awaiting",
      tone: "updating",
      label: t("dashboard.status.supportAwaiting"),
      description: t("dashboard.status.supportAwaitingDesc"),
    };
  }
  if (normalized === "RESOLVED" || normalized === "CLOSED") {
    return {
      id: "support-resolved",
      tone: "live",
      label: t("dashboard.status.supportResolved"),
      description: t("dashboard.status.supportResolvedDesc"),
    };
  }
  return {
    id: "support-action",
    tone: "action",
    label: t("dashboard.status.supportAction"),
    description: t("dashboard.status.supportActionDesc"),
  };
}
