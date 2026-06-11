export type LoginAlertLocale = "en" | "de";

export const PRIVATE_IPV4 =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/;

/** Validates IANA timezone for Intl; falls back to UTC. */
export function resolveLoginAlertTimeZone(raw?: string | null): string {
  const tz = raw?.trim();
  if (!tz) return "UTC";
  try {
    Intl.DateTimeFormat("en-US", { timeZone: tz }).format(new Date());
    return tz;
  } catch {
    return "UTC";
  }
}

export function formatLoginAlertTimestamp(
  when: Date,
  locale: LoginAlertLocale,
  timeZone: string,
): string {
  const loc = locale === "de" ? "de-DE" : "en-US";
  return new Intl.DateTimeFormat(loc, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(when);
}

type BrowserId = "chrome" | "firefox" | "safari" | "edge" | "opera" | "samsung" | "unknown";
type OsId =
  | "windows"
  | "mac"
  | "linux"
  | "android"
  | "iphone"
  | "ipad"
  | "unknown";

function detectBrowser(ua: string): BrowserId {
  if (/Edg\//i.test(ua) || /Edge\//i.test(ua)) return "edge";
  if (/OPR\//i.test(ua) || /Opera/i.test(ua)) return "opera";
  if (/SamsungBrowser/i.test(ua)) return "samsung";
  if (/Firefox\//i.test(ua)) return "firefox";
  if (/Chrome\//i.test(ua) || /CriOS\//i.test(ua)) return "chrome";
  if (/Safari\//i.test(ua)) return "safari";
  return "unknown";
}

function detectOs(ua: string): OsId {
  if (/iPhone/i.test(ua)) return "iphone";
  if (/iPad/i.test(ua)) return "ipad";
  if (/Android/i.test(ua)) return "android";
  if (/Windows NT/i.test(ua)) return "windows";
  if (/Mac OS X|Macintosh/i.test(ua)) return "mac";
  if (/Linux/i.test(ua)) return "linux";
  return "unknown";
}

const BROWSER_LABEL: Record<LoginAlertLocale, Record<BrowserId, string>> = {
  en: {
    chrome: "Chrome",
    firefox: "Firefox",
    safari: "Safari",
    edge: "Microsoft Edge",
    opera: "Opera",
    samsung: "Samsung Internet",
    unknown: "Web browser",
  },
  de: {
    chrome: "Chrome",
    firefox: "Firefox",
    safari: "Safari",
    edge: "Microsoft Edge",
    opera: "Opera",
    samsung: "Samsung Internet",
    unknown: "Webbrowser",
  },
};

const OS_LABEL: Record<LoginAlertLocale, Record<OsId, string>> = {
  en: {
    windows: "Windows",
    mac: "Mac",
    linux: "Linux",
    android: "Android",
    iphone: "iPhone",
    ipad: "iPad",
    unknown: "Unknown device",
  },
  de: {
    windows: "Windows",
    mac: "Mac",
    linux: "Linux",
    android: "Android",
    iphone: "iPhone",
    ipad: "iPad",
    unknown: "Unbekanntes Gerät",
  },
};

/** Turns a raw User-Agent into a short consumer-friendly label. */
export function formatLoginAlertDevice(
  userAgent: string | null | undefined,
  locale: LoginAlertLocale,
): string | null {
  const ua = userAgent?.trim();
  if (!ua) return null;

  const loc = locale === "de" ? "de" : "en";
  const browser = BROWSER_LABEL[loc][detectBrowser(ua)];
  const os = OS_LABEL[loc][detectOs(ua)];

  if (browser === BROWSER_LABEL[loc].unknown && os === OS_LABEL[loc].unknown) {
    return loc === "de" ? "Unbekanntes Gerät" : "Unknown device";
  }
  if (browser === BROWSER_LABEL[loc].unknown) return os;
  if (os === OS_LABEL[loc].unknown) return browser;

  const onWord = loc === "de" ? "auf" : "on";
  return `${browser} ${onWord} ${os}`;
}

/** Partially masks IP for end-user emails; hides local/private addresses. */
export function maskIpForLoginAlert(
  ip: string | null | undefined,
  locale: LoginAlertLocale,
): string | null {
  const raw = ip?.trim();
  if (!raw) return null;

  if (raw === "::1" || raw === "127.0.0.1" || PRIVATE_IPV4.test(raw)) {
    return locale === "de" ? "Lokales oder privates Netzwerk" : "Local or private network";
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(raw)) {
    const parts = raw.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.•••.•••`;
    }
  }

  if (raw.includes(":")) {
    const first = raw.split(":").find((s) => s.length > 0) ?? "••••";
    return `${first}:••••:••••:••••`;
  }

  return locale === "de" ? "Verbindung über ein Netzwerk" : "Connection from a network";
}
