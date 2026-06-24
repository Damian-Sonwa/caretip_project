import type { Socket } from "socket.io-client";
import { REALTIME_EVENTS, type LiveNewTipPayload, type RealtimeEventEnvelope } from "./realtimeContracts";

type TipRaw = LiveNewTipPayload | RealtimeEventEnvelope<LiveNewTipPayload>;

function parseTipPayload(raw: TipRaw): LiveNewTipPayload | null {
  if ("payload" in raw && raw.payload) return raw.payload as LiveNewTipPayload;
  if ("tip" in raw && raw.tip) return raw as LiveNewTipPayload;
  return null;
}

/** Single subscription for tip realtime — canonical envelope + legacy alias. */
export function subscribeTipReceived(
  socket: Socket,
  handler: (payload: LiveNewTipPayload, eventId?: string) => void,
): () => void {
  const onEvent = (raw: TipRaw) => {
    const payload = parseTipPayload(raw);
    if (!payload) return;
    const eventId = "eventId" in raw ? raw.eventId : payload.tip?.id;
    handler(payload, eventId);
  };

  socket.on(REALTIME_EVENTS.TIP_RECEIVED, onEvent);
  socket.on("tip_received", onEvent);

  return () => {
    socket.off(REALTIME_EVENTS.TIP_RECEIVED, onEvent);
    socket.off("tip_received", onEvent);
  };
}
