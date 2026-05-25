/** Curated CareTip onboarding knowledge — used when no LLM API key is configured. */

export const LANDING_AI_SCOPE_REFUSAL =
  "I can only help with CareTip: tipping, QR setup, venues, pricing, GDPR, and onboarding. Try a suggested question or visit our FAQ.";

const EN: Record<string, string> = {
  how_it_works:
    "CareTip lets guests tip in seconds by scanning a branded QR code. Tips route to the right employee or team, and managers see live dashboards without cash handling or awkward card readers.",
  setup_time:
    "Most venues go live in under 15 minutes: create your business account, add staff, generate QR codes, and print or display them. Our setup wizard walks you through each step.",
  qr_customize:
    "Yes. QR codes can carry your logo, brand colors, and venue name. You can generate codes per employee, table, or location so reporting stays accurate.",
  gdpr:
    "CareTip is built for EU hospitality: GDPR-aligned data handling, consent-friendly flows, and clear retention policies. We minimize personal data and support export/deletion requests.",
  employee_tips:
    "Employees receive tips digitally through CareTip payouts (Stripe). They see earnings and goals in their dashboard; managers can track performance without handling cash.",
  multi_venue:
    "Yes. One business account can manage multiple locations, teams, and QR endpoints, ideal for hotel groups, multi-site restaurants, and franchises.",
  pricing:
    "Pricing is transparent: a simple platform fee on processed tips with no hidden hardware costs. Visit the Pricing page for current tiers. You only pay when guests tip.",
  default:
    "CareTip helps hospitality teams collect digital tips via QR codes with live reporting for staff and managers. Ask about setup, pricing, GDPR, or how employees get paid.",
};

const DE: Record<string, string> = {
  how_it_works:
    "Mit CareTip geben Gäste in Sekunden Trinkgeld per QR-Scan. Trinkgelder landen beim richtigen Teammitglied, Manager sehen Live-Dashboards ohne Bargeld oder umständliche Kartenterminals.",
  setup_time:
    "Die meisten Betriebe sind in unter 15 Minuten live: Konto anlegen, Team einladen, QR-Codes erstellen und ausdrucken oder anzeigen. Der Setup-Assistent führt Sie Schritt für Schritt.",
  qr_customize:
    "Ja. QR-Codes können Logo, Markenfarben und Venue-Namen tragen. Pro Mitarbeiter, Tisch oder Standort für saubere Auswertungen.",
  gdpr:
    "CareTip ist für EU-Gastronomie gebaut: DSGVO-konforme Datenverarbeitung, einwilligungsfreundliche Abläufe und klare Aufbewahrung. Wir minimieren personenbezogene Daten.",
  employee_tips:
    "Mitarbeitende erhalten Trinkgelder digital über CareTip-Auszahlungen (Stripe). Dashboard zeigt Verdienste und Ziele; Manager behalten den Überblick ohne Bargeld.",
  multi_venue:
    "Ja. Ein Business-Konto verwaltet mehrere Standorte, Teams und QR-Endpunkte, ideal für Hotelgruppen und Filialbetriebe.",
  pricing:
    "Transparente Preise: eine einfache Plattformgebühr auf verarbeitete Trinkgelder, ohne versteckte Hardware-Kosten. Aktuelle Pakete finden Sie auf der Pricing-Seite.",
  default:
    "CareTip digitalisiert Trinkgelder per QR mit Live-Reporting für Teams und Manager. Fragen Sie zu Setup, Preisen, DSGVO oder Auszahlungen.",
};

export function getKnowledgeReply(promptId: string | undefined, locale: string): string {
  const isDe = locale.toLowerCase().startsWith("de");
  const map = isDe ? DE : EN;
  if (promptId && map[promptId]) return map[promptId];
  return map.default;
}

const OFF_TOPIC =
  /\b(write\s+code|homework|weather|bitcoin|crypto|stock|recipe|joke|poem|politics|dating|medical\s+advice)\b/i;

export function isLikelyOffTopic(message: string): boolean {
  const m = message.trim();
  if (m.length < 8) return false;
  if (OFF_TOPIC.test(m)) return true;
  const caretipHints =
    /\b(caretip|tip|qr|gdpr|dsgo|employee|staff|venue|restaurant|hotel|hospitality|pricing|setup|onboard|stripe|manager|dashboard)\b/i;
  return !caretipHints.test(m) && m.length > 120;
}
