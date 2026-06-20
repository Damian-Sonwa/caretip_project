import { resolveApiBaseUrl } from "./apiOrigin";

let remoteApiWakeStarted = false;

/** Fire-and-forget ping so a sleeping Render instance can wake before sign-in. */
export function wakeRemoteApi(): void {
  const base = resolveApiBaseUrl();
  if (!base || remoteApiWakeStarted) return;
  remoteApiWakeStarted = true;
  void fetch(`${base}/health`, { method: "GET", mode: "cors", credentials: "omit" }).catch(
    () => undefined,
  );
}
