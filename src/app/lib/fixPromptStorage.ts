/** localStorage: survives sessions. sessionStorage: dismiss clears when the tab session ends. */
export type FixPromptDismissPersistence = "local" | "session";

const LOCAL_KEY = "dismissedFixes";
const SESSION_KEY = "dismissedFixesSession";

function parseList(raw: string | null): string[] {
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function readDismissedFixIds(persistence: FixPromptDismissPersistence): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw =
      persistence === "local" ? window.localStorage.getItem(LOCAL_KEY) : window.sessionStorage.getItem(SESSION_KEY);
    return parseList(raw);
  } catch {
    return [];
  }
}

function writeDismissedFixIds(ids: string[], persistence: FixPromptDismissPersistence): void {
  if (typeof window === "undefined") return;
  try {
    const json = JSON.stringify(ids);
    if (persistence === "local") window.localStorage.setItem(LOCAL_KEY, json);
    else window.sessionStorage.setItem(SESSION_KEY, json);
  } catch {
    // ignore quota / private mode
  }
}

export function addDismissedFixId(id: string, persistence: FixPromptDismissPersistence): void {
  const next = new Set(readDismissedFixIds(persistence));
  next.add(id);
  writeDismissedFixIds([...next], persistence);
}

/** When the underlying issue is gone, clear this id from both stores so the prompt can return if needed. */
export function removeDismissedFixId(id: string): void {
  const local = readDismissedFixIds("local").filter((x) => x !== id);
  const sess = readDismissedFixIds("session").filter((x) => x !== id);
  writeDismissedFixIds(local, "local");
  writeDismissedFixIds(sess, "session");
}
