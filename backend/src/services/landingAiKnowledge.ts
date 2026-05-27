/** CareTip product knowledge and FAQ grounding for Ask CareTip (landing assistant). */

export const LANDING_AI_SCOPE_REFUSAL =
  "I'm here for CareTip questions: tipping, QR setup, dashboards, pricing, and onboarding. What would you like to know about the product?";

/** Core product context injected into the LLM system prompt (not shown to users). */
export const CARETIP_PRODUCT_CONTEXT = `
CareTip is a digital tipping platform for hospitality (restaurants, hotels, bars, cafes).

GUEST TIPPING FLOW:
- Guests scan a branded QR code (employee, table, or location) in the mobile browser. No guest app required.
- They choose tip amount, pay by card or digital wallet (Stripe), and can leave optional feedback.
- Tips route to the selected employee or team context the QR represents.

BUSINESS WORKFLOWS:
- Business owners sign up, complete onboarding/KYC as required, add locations, invite staff, generate QR codes.
- Managers use dashboards for tips, staff performance, goals, tables/locations, and reporting by timeframe.
- Multiple venues/locations supported on higher tiers; staff and QR codes can be scoped per location.

EMPLOYEE WORKFLOWS:
- Employees activate accounts, complete profile/payout details, receive digital tips via configured payouts (Stripe).
- Employee dashboard shows earnings, goals, tip activity, and notifications when tips arrive (timing depends on settings/connectivity).

PAYOUTS & PAYMENTS:
- Tips are processed by secure payment partners (PCI-compliant); CareTip does not store full card numbers.
- Payout timing and methods depend on business verification, Stripe/payout settings, and employee profile completion.
- Never state a specific dollar balance, payout date, or that a payment succeeded for this user.

QR & SETUP:
- Typical go-live: create business account, add staff, generate QR codes, print or display (often under ~15 minutes with the setup wizard).
- QR codes can reflect brand logo, colors, venue name; per employee, table, or location for accurate reporting.

PRICING:
- Transparent platform fee on processed tips; tier details on the public Pricing page. Do not invent fee percentages.

SECURITY & GDPR:
- GDPR-aligned handling for EU hospitality; consent-friendly flows; data minimization; export/deletion supported via support processes.

ANALYTICS & NOTIFICATIONS:
- Live dashboards for businesses and employees; analytics by timeframe; push/email notifications where enabled.

SUPPORT:
- Help Center, FAQs, and contact form for account-specific issues. You cannot access user accounts or live data.
`.trim();

export type FaqEntry = {
  id: string;
  keywords: string[];
  en: string;
  de: string;
};

export const FAQ_ENTRIES: FaqEntry[] = [
  {
    id: "how_it_works",
    keywords: ["how", "work", "what is", "caretip", "platform", "digital tip"],
    en: "CareTip lets guests tip in seconds by scanning a branded QR code. Tips route to the right employee or team, and managers see live dashboards without cash handling or awkward card readers.",
    de: "Mit CareTip geben Gäste in Sekunden Trinkgeld per QR-Scan. Trinkgelder landen beim richtigen Teammitglied, Manager sehen Live-Dashboards ohne Bargeld oder umständliche Kartenterminals.",
  },
  {
    id: "setup_time",
    keywords: ["setup", "long", "minute", "onboard", "start", "go live", "wizard"],
    en: "Most venues go live in under 15 minutes: create your business account, add staff, generate QR codes, and print or display them. The setup wizard walks you through each step.",
    de: "Die meisten Betriebe sind in unter 15 Minuten live: Konto anlegen, Team einladen, QR-Codes erstellen und ausdrucken oder anzeigen. Der Setup-Assistent führt Sie Schritt für Schritt.",
  },
  {
    id: "qr_customize",
    keywords: ["qr", "custom", "brand", "logo", "color", "table", "print"],
    en: "QR codes can carry your logo, brand colors, and venue name. You can generate codes per employee, table, or location so reporting stays accurate.",
    de: "QR-Codes können Logo, Markenfarben und Venue-Namen tragen. Pro Mitarbeiter, Tisch oder Standort für saubere Auswertungen.",
  },
  {
    id: "gdpr",
    keywords: ["gdpr", "dsgvo", "privacy", "data", "compliance", "eu"],
    en: "CareTip is built for EU hospitality: GDPR-aligned data handling, consent-friendly flows, and clear retention policies. Personal data is minimized; export and deletion requests are supported.",
    de: "CareTip ist für EU-Gastronomie gebaut: DSGVO-konforme Datenverarbeitung, einwilligungsfreundliche Abläufe und klare Aufbewahrung. Wir minimieren personenbezogene Daten.",
  },
  {
    id: "employee_tips",
    keywords: ["employee", "staff", "receive", "paid", "payout", "earn", "dashboard"],
    en: "Employees receive tips digitally through CareTip payouts (Stripe). They see earnings and goals in their dashboard; managers track performance without handling cash.",
    de: "Mitarbeitende erhalten Trinkgelder digital über CareTip-Auszahlungen (Stripe). Das Dashboard zeigt Verdienste und Ziele; Manager behalten den Überblick ohne Bargeld.",
  },
  {
    id: "multi_venue",
    keywords: ["venue", "location", "multiple", "multi", "franchise", "hotel group"],
    en: "One business account can manage multiple locations, teams, and QR endpoints, ideal for hotel groups, multi-site restaurants, and franchises.",
    de: "Ein Business-Konto verwaltet mehrere Standorte, Teams und QR-Endpunkte, ideal für Hotelgruppen und Filialbetriebe.",
  },
  {
    id: "pricing",
    keywords: ["price", "cost", "fee", "tier", "charge", "expensive"],
    en: "Pricing is transparent: a platform fee on processed tips with no hidden hardware costs. See the Pricing page for current tiers. You only pay when guests tip.",
    de: "Transparente Preise: eine Plattformgebühr auf verarbeitete Trinkgelder, ohne versteckte Hardware-Kosten. Aktuelle Pakete auf der Pricing-Seite.",
  },
  {
    id: "guest_no_app",
    keywords: ["guest", "app", "download", "browser", "phone"],
    en: "Guests tip from their phone browser via QR or link. No app download is required for the guest tipping flow.",
    de: "Gäste geben Trinkgeld im Browser per QR oder Link. Für Gäste ist keine App nötig.",
  },
  {
    id: "security",
    keywords: ["secure", "security", "pci", "card", "safe", "payment"],
    en: "CareTip uses industry-standard security and payment processors that meet PCI standards. Card data is handled by those partners; full card numbers are not stored on CareTip servers.",
    de: "CareTip nutzt etablierte Sicherheitsstandards und PCI-konforme Zahlungsdienstleister. Kartendaten verarbeiten die Partner; vollständige Kartennummern speichern wir nicht.",
  },
  {
    id: "disputes",
    keywords: ["dispute", "chargeback", "refund", "guest dispute"],
    en: "Card networks and banks handle disputes per their rules. CareTip may share transaction details with processors to help resolve cases. Account-specific help goes through support.",
    de: "Streitfälle bearbeiten Kartennetzwerke und Banken nach ihren Regeln. CareTip kann Transaktionsdetails an Prozessoren weitergeben. Für Einzelfälle: Support kontaktieren.",
  },
  {
    id: "realtime_tips",
    keywords: ["real time", "realtime", "notify", "notification", "instant", "live"],
    en: "Employees can be notified when new tips arrive, depending on settings and connectivity. Dashboards update for businesses and staff; exact timing may vary by device and network.",
    de: "Mitarbeitende können bei neuen Trinkgeldern benachrichtigt werden (je nach Einstellung und Verbindung). Dashboards aktualisieren sich; das Timing kann variieren.",
  },
  {
    id: "support",
    keywords: ["support", "help", "contact", "email"],
    en: "Use the Help Center, FAQs, or contact form. Email support is available; response times depend on volume and business hours.",
    de: "Nutzen Sie Help Center, FAQs oder das Kontaktformular. E-Mail-Support ist verfügbar.",
  },
];

const FALLBACK_INTROS_EN = [
  "Here's how I'd put it:",
  "In short:",
  "Happy to explain:",
  "Sure thing:",
];
const FALLBACK_INTROS_DE = [
  "Kurz gesagt:",
  "Gerne erklärt:",
  "So funktioniert es:",
  "Gute Frage:",
];

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2),
  );
}

function scoreFaqEntry(entry: FaqEntry, userText: string, promptId?: string): number {
  let score = 0;
  if (promptId && entry.id === promptId) score += 120;
  const lower = userText.toLowerCase();
  for (const kw of entry.keywords) {
    if (lower.includes(kw.toLowerCase())) score += 12;
  }
  const userTokens = tokenize(userText);
  const entryTokens = tokenize(`${entry.id} ${entry.keywords.join(" ")}`);
  for (const t of userTokens) {
    if (entryTokens.has(t)) score += 4;
  }
  return score;
}

/** Rank FAQ snippets for grounding (highest relevance first). */
export function rankFaqEntries(
  userText: string,
  promptId?: string,
  limit = 4,
): FaqEntry[] {
  const scored = FAQ_ENTRIES.map((entry) => ({
    entry,
    score: scoreFaqEntry(entry, userText, promptId),
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0 && promptId) {
    const pinned = FAQ_ENTRIES.find((e) => e.id === promptId);
    if (pinned) return [pinned];
  }

  return scored.slice(0, limit).map((x) => x.entry);
}

export function buildFaqGroundingBlock(entries: FaqEntry[], locale: string): string {
  if (entries.length === 0) return "(No specific FAQ snippet matched; use product context only.)";
  const isDe = locale.toLowerCase().startsWith("de");
  return entries
    .map((e, i) => `[${i + 1}] (${e.id}) ${isDe ? e.de : e.en}`)
    .join("\n");
}

export function getKnowledgeReply(promptId: string | undefined, locale: string): string {
  const isDe = locale.toLowerCase().startsWith("de");
  const entry = promptId ? FAQ_ENTRIES.find((e) => e.id === promptId) : undefined;
  if (entry) return isDe ? entry.de : entry.en;
  const defaultEntry = FAQ_ENTRIES.find((e) => e.id === "how_it_works");
  return isDe ? (defaultEntry?.de ?? DE_DEFAULT) : (defaultEntry?.en ?? EN_DEFAULT);
}

const EN_DEFAULT =
  "CareTip helps hospitality teams collect digital tips via QR codes with live reporting for staff and managers. Ask about setup, pricing, GDPR, or how employees get paid.";
const DE_DEFAULT =
  "CareTip digitalisiert Trinkgelder per QR mit Live-Reporting für Teams und Manager. Fragen Sie zu Setup, Preisen, DSGVO oder Auszahlungen.";

/** Conversational fallback when OpenAI is unavailable (paraphrase, not verbatim FAQ dump). */
export function composeFallbackReply(input: {
  userText: string;
  locale: string;
  promptId?: string;
}): string {
  const isDe = input.locale.toLowerCase().startsWith("de");
  const ranked = rankFaqEntries(input.userText, input.promptId, 2);
  const intros = isDe ? FALLBACK_INTROS_DE : FALLBACK_INTROS_EN;
  const intro = intros[Math.abs(hashString(input.userText)) % intros.length];

  if (ranked.length === 0) {
    const tail = isDe
      ? " Worüber möchten Sie mehr erfahren: Setup, QR-Codes, Preise oder Auszahlungen?"
      : " What should we dig into next: setup, QR codes, pricing, or payouts?";
    return `${intro} ${getKnowledgeReply(undefined, input.locale)}${tail}`;
  }

  const primary = isDe ? ranked[0].de : ranked[0].en;
  const secondary =
    ranked.length > 1 ? (isDe ? ranked[1].de : ranked[1].en) : null;

  const clarify = isDe
    ? " Sag Bescheid, wenn Sie ein bestimmtes Szenario meinen (z. B. nur Mitarbeiter-QR oder mehrere Standorte)."
    : " Tell me if you have a specific scenario in mind (e.g. employee-only QR vs multiple locations).";

  if (!secondary) {
    return `${intro} ${primary} ${clarify}`;
  }

  const bridge = isDe
    ? " Außerdem:"
    : " Also worth noting:";
  const secondaryShort =
    secondary.length > 160 ? `${secondary.slice(0, 157).trim()}…` : secondary;
  return `${intro} ${primary} ${bridge} ${secondaryShort} ${clarify}`;
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}

const OFF_TOPIC =
  /\b(write\s+code|homework|weather|bitcoin|crypto|stock|recipe|joke|poem|politics|dating|medical\s+advice)\b/i;

/** Only block clearly abusive/off-scope requests; product questions go to the model. */
export function isLikelyOffTopic(message: string): boolean {
  const m = message.trim();
  if (m.length < 8) return false;
  return OFF_TOPIC.test(m);
}
