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
  input: {
    isRefreshing: boolean;
    isSettled: boolean;
    hasData: boolean;
    refreshFailed?: boolean;
    hasVisibleData?: boolean;
  },
  t: TFunction,
  updatingDescKey: string,
  upToDateDescKey: string,
  noDataDescKey: string,
): DashboardStatusItem | null {
  if (input.isRefreshing) {
    return {
      id: "sync",
      tone: "updating",
      label: t("dashboard.status.updating"),
      description: t(updatingDescKey),
    };
  }
  if (input.refreshFailed && input.hasVisibleData) {
    return {
      id: "sync",
      tone: "action",
      label: t("dashboard.status.refreshFailed"),
      description: t("dashboard.status.dataLoadFailed"),
    };
  }
  if (!input.isSettled) {
    return {
      id: "sync",
      tone: "updating",
      label: t("dashboard.status.updating"),
      description: t(updatingDescKey),
    };
  }
  if (!input.hasData) {
    return {
      id: "sync",
      tone: "updating",
      label: t("format.noDataYet"),
      description: t(noDataDescKey),
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
    isPeriodSyncing: boolean;
    isMetricsSettled: boolean;
    hasPeriodActivity: boolean;
    pendingVerification: boolean;
    statsLoadFailed: string | null;
    hasVisibleMetrics: boolean;
    socketStatus: SocketConnectionStatus;
  },
  t: TFunction,
): DashboardStatusItem[] {
  const items: DashboardStatusItem[] = [];

  if (input.statsLoadFailed && !input.hasVisibleMetrics) {
    items.push({
      id: "data-action",
      tone: "action",
      label: t("dashboard.status.actionRequired"),
      description: t("dashboard.status.dataLoadFailed"),
    });
    return items;
  }

  if (input.statsLoadFailed) {
    items.push({
      id: "data-action",
      tone: "action",
      label: t("dashboard.status.refreshFailed"),
      description: input.statsLoadFailed,
    });
  }

  const connection = deriveConnectionStatusItem(input.socketStatus, t);
  if (connection) items.push(connection);

  const sync = deriveSyncStatusItem(
    {
      isRefreshing: input.isPeriodSyncing,
      isSettled: input.isMetricsSettled,
      hasData: input.hasPeriodActivity,
      refreshFailed: Boolean(input.statsLoadFailed),
      hasVisibleData: input.hasVisibleMetrics,
    },
    t,
    "dashboard.status.businessUpdatingDesc",
    "dashboard.status.businessLiveDesc",
    "dashboard.status.businessNoDataDesc",
  );
  if (sync) items.push(sync);

  return items;
}

export function deriveEmployeeDashboardStatus(
  input: {
    isPeriodSyncing: boolean;
    isMetricsSettled: boolean;
    hasPeriodActivity: boolean;
    statsLoadFailed: string | null;
    hasVisibleMetrics: boolean;
    socketStatus: SocketConnectionStatus;
  },
  t: TFunction,
): DashboardStatusItem[] {
  const items: DashboardStatusItem[] = [];

  if (input.statsLoadFailed && !input.hasVisibleMetrics) {
    items.push({
      id: "data-action",
      tone: "action",
      label: t("dashboard.status.actionRequired"),
      description: input.statsLoadFailed,
    });
    return items;
  }

  if (input.statsLoadFailed) {
    items.push({
      id: "data-action",
      tone: "action",
      label: t("dashboard.status.refreshFailed"),
      description: input.statsLoadFailed,
    });
  }

  const connection = deriveConnectionStatusItem(input.socketStatus, t);
  if (connection) items.push(connection);

  const sync = deriveSyncStatusItem(
    {
      isRefreshing: input.isPeriodSyncing,
      isSettled: input.isMetricsSettled,
      hasData: input.hasPeriodActivity,
      refreshFailed: Boolean(input.statsLoadFailed),
      hasVisibleData: input.hasVisibleMetrics,
    },
    t,
    "dashboard.status.employeeUpdatingDesc",
    "dashboard.status.employeeDataUpToDateDesc",
    "dashboard.status.employeeNoDataDesc",
  );
  if (sync) items.push(sync);

  return items;
}

export function derivePlatformAdminDashboardStatus(
  input: {
    isInitialLoading: boolean;
    isSyncing: boolean;
    analyticsSyncing: boolean;
    isAnalyticsSettled: boolean;
    hasPeriodActivity: boolean;
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

  const sync = deriveSyncStatusItem(
    {
      isRefreshing: input.isSyncing || input.analyticsSyncing,
      isSettled: input.isAnalyticsSettled,
      hasData: input.hasPeriodActivity,
    },
    t,
    "dashboard.status.adminUpdatingDesc",
    "dashboard.status.adminDataUpToDateDesc",
    "dashboard.status.adminNoDataDesc",
  );
  if (sync) items.push(sync);

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
