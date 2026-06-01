/**
 * Dev-only [LoaderDiag] flag transitions for loading deadlock investigation.
 */

type FlagName =
  | "authLoading"
  | "sessionLoading"
  | "routeLoading"
  | "dashboardLoading"
  | "profileLoading"
  | "businessLoading"
  | "employeeLoading"
  | "onboardingLoading"
  | "destinationReady"
  | "pageReady";

const flagState = new Map<string, boolean>();

export function traceLoaderFlag(
  name: FlagName | string,
  value: boolean,
  source?: string,
): void {
  if (!import.meta.env.DEV) return;
  const key = source ? `${name}:${source}` : name;
  const prev = flagState.get(key);
  if (prev === value) return;
  flagState.set(key, value);
  const tag = value ? "TRUE" : "FALSE";
  if (source) {
    console.info(`[LoaderDiag] ${name} → ${tag}`, { source });
  } else {
    console.info(`[LoaderDiag] ${name} → ${tag}`);
  }
}

export function traceLoaderRegistration(key: string, active: boolean, priority: number): void {
  if (!import.meta.env.DEV) return;
  const regKey = `reg:${key}`;
  const prev = flagState.get(regKey);
  if (prev === active) return;
  flagState.set(regKey, active);
  console.info(`[LoaderDiag] registration → ${active ? "ACTIVE" : "released"}`, {
    key,
    priority,
  });
}

export function getLoaderDiagSnapshot(): Record<string, unknown> {
  const activeRegs = [...flagState.entries()]
    .filter(([k, v]) => k.startsWith("reg:") && v)
    .map(([k]) => k.slice(4));

  const flags: Record<string, boolean> = {};
  for (const [k, v] of flagState.entries()) {
    if (!k.startsWith("reg:")) flags[k] = v;
  }

  return { activeRegistrations: activeRegs, flags, flagState: Object.fromEntries(flagState) };
}

export function logLoaderDiagSnapshot(context: string, extra?: Record<string, unknown>): void {
  if (!import.meta.env.DEV) return;
  console.info(`[LoaderDiag] Snapshot — ${context}`, { ...getLoaderDiagSnapshot(), ...extra });
}

/** Warn when overlay winner unchanged for too long. */
export function warnLoaderDiagDeadlock(
  winnerKey: string | null,
  activeKeys: string[],
  extra?: Record<string, unknown>,
): void {
  if (!import.meta.env.DEV) return;
  console.warn("[LoaderDiag] DEADLOCK SUSPECT — overlay stuck", {
    winnerKey,
    activeKeys,
    ...getLoaderDiagSnapshot(),
    ...extra,
  });
}
