import { useCallback, useEffect, useMemo, useState } from "react";
import type { TipActivityRow } from "../lib/api";
import type { LiveNewTipPayload, RealtimeEventEnvelope } from "../lib/realtime/realtimeContracts";
import { REALTIME_EVENTS } from "../lib/realtime/realtimeContracts";
import { subscribeTipReceived } from "../lib/realtime/subscribeTipReceived";
import { shouldProcessRealtimeEvent } from "../lib/realtime/realtimeEventDedupe";
import { useSocket, useDeferSocketConnect } from "./useSocket";

export type LiveActivityKind =
  | "tip_received"
  | "qr_scanned"
  | "goal_updated"
  | "goal_achieved"
  | "employee_joined"
  | "employee_updated"
  | "location_created"
  | "employee_invited"
  | "billing_updated";

export type LiveActivityItem = {
  id: string;
  kind: LiveActivityKind;
  at: string;
  title: string;
  subtitle?: string;
  amountEur?: number;
  live?: boolean;
};

type UseLiveActivityStreamOptions = {
  enabled: boolean;
  businessId?: string | null;
  initialTips?: TipActivityRow[];
  t: (key: string, opts?: Record<string, unknown>) => string;
};

function tipRowToActivity(tip: TipActivityRow, t: UseLiveActivityStreamOptions["t"]): LiveActivityItem {
  return {
    id: `tip:${tip.id}`,
    kind: "tip_received",
    at: tip.createdAt,
    title: tip.staffName ?? t("business.tips.live.anonymousGuest"),
    subtitle: tip.locationName ?? tip.tableName ?? t("business.tips.live.venueDefault"),
    amountEur: tip.amount,
  };
}

const REASON_TO_KIND: Record<string, LiveActivityKind> = {
  location_created: "location_created",
  employee_invited: "employee_invited",
  employee_activated: "employee_joined",
  staff_invited: "employee_invited",
  subscription_tier_updated: "billing_updated",
};

export function useLiveActivityStream({
  enabled,
  businessId,
  initialTips = [],
  t,
}: UseLiveActivityStreamOptions) {
  const [items, setItems] = useState<LiveActivityItem[]>([]);
  const [liveIds, setLiveIds] = useState<Set<string>>(new Set());
  const socketReady = useDeferSocketConnect(enabled);
  const { socket } = useSocket(socketReady);

  useEffect(() => {
    setItems(initialTips.map((tip) => tipRowToActivity(tip, t)));
  }, [initialTips, t]);

  const prepend = useCallback((item: LiveActivityItem) => {
    setItems((prev) => {
      if (prev.some((p) => p.id === item.id)) return prev;
      return [item, ...prev].slice(0, 40);
    });
    setLiveIds((prev) => new Set(prev).add(item.id));
    window.setTimeout(() => {
      setLiveIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }, 12_000);
  }, []);

  const onTip = useCallback(
    (payload: LiveNewTipPayload) => {
      if (businessId && payload.businessId !== businessId) return;
      prepend({
        id: `tip:${payload.tip.id}`,
        kind: "tip_received",
        at: payload.tip.createdAt,
        title: payload.employeeName ?? t("business.tips.live.anonymousGuest"),
        subtitle: t("business.tips.live.venueDefault"),
        amountEur: payload.tip.amount,
        live: true,
      });
    },
    [businessId, prepend, t],
  );

  useEffect(() => {
    if (!socket || !enabled) return;

    const handleQr = (raw: RealtimeEventEnvelope<{ scanType: string; scannedAt: string }>) => {
      if (!shouldProcessRealtimeEvent(raw.eventId)) return;
      if (businessId && raw.businessId && raw.businessId !== businessId) return;
      prepend({
        id: `qr:${raw.entityIds.scanId ?? raw.eventId}`,
        kind: "qr_scanned",
        at: raw.payload?.scannedAt ?? raw.timestamp,
        title: t("business.liveActivity.qrScanned"),
        subtitle: raw.payload?.scanType ?? "qr",
        live: true,
      });
    };

    const unsubTip = subscribeTipReceived(socket, (payload, eventId) => {
      if (!shouldProcessRealtimeEvent(eventId)) return;
      onTip(payload);
    });

    socket.on(REALTIME_EVENTS.QR_SCANNED, handleQr);

    const handleBusinessData = (payload: { businessId: string; reason: string; at: string }) => {
      if (businessId && payload.businessId !== businessId) return;
      const kind = REASON_TO_KIND[payload.reason];
      if (!kind) return;
      const id = `biz:${payload.reason}:${payload.at}`;
      if (!shouldProcessRealtimeEvent(id)) return;
      const titleKey =
        kind === "location_created"
          ? "business.liveActivity.locationCreated"
          : kind === "employee_invited"
            ? "business.liveActivity.employeeInvited"
            : kind === "employee_joined"
              ? "business.liveActivity.employeeJoined"
              : "business.liveActivity.billingUpdated";
      prepend({
        id,
        kind,
        at: payload.at,
        title: t(titleKey),
        live: true,
      });
    };

    const handleGoal = (raw: RealtimeEventEnvelope<{ status?: string }>) => {
      if (!shouldProcessRealtimeEvent(raw.eventId)) return;
      if (businessId && raw.businessId && raw.businessId !== businessId) return;
      const achieved = raw.payload?.status === "achieved";
      prepend({
        id: `goal:${raw.entityIds.goalId ?? raw.eventId}`,
        kind: achieved ? "goal_achieved" : "goal_updated",
        at: raw.timestamp,
        title: achieved ? t("business.liveActivity.goalAchieved") : t("business.liveActivity.goalUpdated"),
        live: true,
      });
    };

    const onEmployeeUpdated = (raw: RealtimeEventEnvelope<{ reason: string }>) => {
      if (!shouldProcessRealtimeEvent(raw.eventId)) return;
      prepend({
        id: `emp:${raw.eventId}`,
        kind: "employee_updated",
        at: raw.timestamp,
        title: t("business.liveActivity.employeeUpdated"),
        subtitle: raw.payload?.reason,
        live: true,
      });
    };

    socket.on("business_data_updated", handleBusinessData);
    socket.on(REALTIME_EVENTS.GOAL_UPDATED, handleGoal);
    socket.on(REALTIME_EVENTS.EMPLOYEE_UPDATED, onEmployeeUpdated);

    return () => {
      unsubTip();
      socket.off(REALTIME_EVENTS.QR_SCANNED, handleQr);
      socket.off("business_data_updated", handleBusinessData);
      socket.off(REALTIME_EVENTS.GOAL_UPDATED, handleGoal);
      socket.off(REALTIME_EVENTS.EMPLOYEE_UPDATED, onEmployeeUpdated);
    };
  }, [socket, enabled, businessId, onTip, prepend, t]);

  const liveIdSet = useMemo(() => liveIds, [liveIds]);

  return { items, liveIds: liveIdSet };
}
