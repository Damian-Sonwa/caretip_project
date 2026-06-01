/**
 * One-off patch for approved translator PDF content.
 * Run: node scripts/patch-translations.mjs
 */
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const localesDir = join(root, "src/i18n/locales");

function load(name) {
  return JSON.parse(readFileSync(join(localesDir, name), "utf8"));
}
function save(name, data) {
  writeFileSync(join(localesDir, name), `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

const en = load("en.json");
const de = load("de.json");

// --- nav ---
de.nav = { ...de.nav, becomePartner: "Jetzt Partner werden", staffPortal: "Mitarbeiter-Portal" };
en.nav = { ...en.nav, becomePartner: en.nav.becomePartner ?? "Get Started", staffPortal: en.nav.staffPortal ?? "Staff Access" };

// --- staticPages.common trust (default) ---
de.staticPages.common.trustChips = {
  liveMinutes: "In wenigen Minuten startklar",
  noApp: "Kein App-Download nötig",
  instantPayouts: "Sofortige Auszahlungen",
  secureOnboarding: "Sicheres Onboarding",
  worksInstantly: "Sofort einsatzbereit",
};
en.staticPages.common.trustChips = {
  liveMinutes: "Live in minutes",
  noApp: "No app download",
  instantPayouts: "Instant payouts",
  secureOnboarding: "Secure onboarding",
  worksInstantly: "Works instantly",
};

de.staticPages.common.trustChipsFaq = {
  liveMinutes: "In wenigen Minuten startklar",
  noApp: "Kein App-Download nötig",
  instantPayouts: "Sofortige Auszahlungen",
  secureOnboarding: "Sicheres Onboarding",
  worksInstantly: "Sofort spürbare Effekte",
};
en.staticPages.common.trustChipsFaq = {
  liveMinutes: "Live in minutes",
  noApp: "No app download",
  instantPayouts: "Instant payouts",
  secureOnboarding: "Secure onboarding",
  worksInstantly: "Instant results",
};

de.staticPages.common.trustChipsPricing = {
  noApp: "Kein App-Download nötig (Funktioniert sofort im mobilen Browser)",
  instantPayouts: "Schnelle Auszahlungen (Direkt aufs Konto der Mitarbeiter)",
  secureOnboarding: "Sicheres Onboarding (Ruckzuck und datenschutzkonform eingerichtet)",
  worksInstantly: "Sofort einsatzbereit (Ohne lange Einarbeitung oder IT-Aufwand)",
};
en.staticPages.common.trustChipsPricing = {
  noApp: "No app download (Works instantly in the mobile browser)",
  instantPayouts: "Fast payouts (Direct to employee accounts)",
  secureOnboarding: "Secure onboarding (Quick and privacy-compliant setup)",
  worksInstantly: "Ready instantly (No lengthy training or IT effort)",
};

de.staticPages.common.trustChipsHowItWorks = {
  liveMinutes: "In wenigen Minuten live",
  noApp: "Kein App-Download erforderlich",
  instantPayouts: "Sofortige Auszahlungen",
  secureOnboarding: "Sicheres Onboarding",
};
en.staticPages.common.trustChipsHowItWorks = {
  liveMinutes: "Live in minutes",
  noApp: "No app download required",
  instantPayouts: "Instant payouts",
  secureOnboarding: "Secure onboarding",
};

// --- features page ---
de.staticPages.features = {
  ...de.staticPages.features,
  title: "Das alles kann CareTip für Sie tun",
  subtitle:
    "Caring is Tipping! Weil großartiger Einsatz echte Anerkennung verdient. Erleben Sie eine Plattform, die mit Herzblut perfekt auf die besonderen Bedürfnisse von Service, Pflege und Dienstleistung abgestimmt ist. CareTip macht es Ihren Kunden, Gästen oder Patienten so leicht, intuitiv und inspirierend wie nie zuvor, von Herzen Danke zu sagen – und diese Wertschätzung direkt digital ins Team zu tragen. Machen Sie guten Service unvergesslich!",
  f1Title: "Trinkgeld per QR-Code",
  f1Desc:
    "Kunden, Gäste, Patienten oder Angehörige scannen den Code und geben in Sekundenschnelle Trinkgeld – komplett ohne App-Installation und absolut barrierefrei.",
  f2Title: "Analysen & Auswertungen",
  f2Desc:
    "Schichttrends, Team-Leistungen und Live-Aktivitäten für alle Standorte und Bereiche – übersichtlich vereint in einem Dashboard.",
  f3Title: "Team-Übersicht",
  f3Desc:
    "Verfolgen Sie Trinkgelder, Bewertungen und gemeinsame Ziele an einem zentralen Ort – für ein dauerhaft motiviertes Team.",
  f4Title: "Abgesichert durch Stripe",
  f4Desc:
    "Ein weltweit vertrauenswürdiger Bezahlprozess und modernste Sicherheitsstandards sorgen dafür, dass alle Zahlungen absolut verlässlich und geschützt ablaufen.",
  f5Title: "Live-Benachrichtigungen",
  f5Desc:
    "Live-Aktivitäten und direkte Benachrichtigungen sorgen dafür, dass Sie Ihr Team optimal unterstützen und jederzeit schnell reagieren können.",
  f6Title: "Standortübergreifend flexibel",
  f6Desc:
    "Verwalten Sie verschiedene Betriebe, Standorte und Bereiche, ohne dabei jemals den Überblick zu verlieren.",
  momentsTitle: "Das Beste für alle Beteiligten",
  momentsSubtitle:
    "Maßgeschneiderte Ansichten für Ihr gesamtes Umfeld — Erfahren Sie, wie CareTip den Alltag für Kunden, Teams, Führungskräfte und die Buchhaltung spürbar erleichtert.",
  moments: {
    qr: {
      title: "Das QR-Erlebnis",
      subtitle: "Individuelles Design für Ihren Außenauftritt",
      body: "Gebrandete Codes und Trinkgeld-Seiten, die sich nahtlos in das Erscheinungsbild Ihres Betriebs einfügen.",
    },
    employee: {
      title: "Sofortige Benachrichtigungen, volle Transparenz und neue Motivation für jede Schicht.",
      subtitle: "",
      body: "Mitarbeiter erhalten Trinkgeld-Updates in Echtzeit, behalten den absoluten Überblick über ihre Einnahmen und starten hochmotiviert in jeden Arbeitstag.",
    },
    payouts: {
      title: "Auszahlungen & Sicherheit",
      subtitle: "Sichere Verarbeitung und transparente Auszahlungsstatus, denen Ihr Team voll vertraut.",
      body: "Eine absolut geschützte Abwicklung und lückenlos nachvollziehbare Auszahlungsschritte sorgen für maximale Sicherheit und Verlässlichkeit bei Ihren Mitarbeitern.",
    },
    analytics: {
      title: "Voller Durchblick bei den Analysen",
      subtitle: "Schichttrends, Top-Performer und Live-Aktivitäten – ganz ohne Excel-Chaos.",
      body: "Behalten Sie die Entwicklung der Schichten, herausragende Team-Leistungen und alle Aktivitäten in Echtzeit im Blick, statt sich durch unübersichtliche Tabellen zu kämpfen.",
    },
  },
};

en.staticPages.features = {
  ...en.staticPages.features,
  title: "What CareTip can do for you",
  subtitle:
    "Caring is Tipping! Because outstanding dedication deserves real recognition. Discover a platform passionately tailored to the unique needs of hospitality, healthcare, and personal services. CareTip makes it easier, more intuitive, and more inspiring than ever before for your clients, guests, or patients to say a heartfelt thank you – turning digital appreciation directly into a powerful boost for your team. Make exceptional service unforgettable!",
  momentsTitle: "The best for everyone involved",
  momentsSubtitle:
    "Tailored views for your entire environment. See how CareTip makes everyday life easier for guests, teams, managers, and finance.",
  moments: {
    qr: {
      title: "The QR experience",
      subtitle: "Individual design for your public presence",
      body: "Branded codes and tipping pages that blend seamlessly into your business appearance.",
    },
    employee: {
      title: "Instant notifications, full transparency, and fresh motivation for every shift.",
      subtitle: "",
      body: "Employees receive real-time tip updates, keep full overview of their earnings, and start every workday highly motivated.",
    },
    payouts: {
      title: "Payouts & security",
      subtitle: "Secure processing and transparent payout status your team can trust.",
      body: "Fully protected processing and traceable payout steps provide maximum security and reliability for your employees.",
    },
    analytics: {
      title: "Full clarity in analytics",
      subtitle: "Shift trends, top performers, and live activity – without Excel chaos.",
      body: "Track shift development, outstanding team performance, and all activity in real time instead of fighting unclear spreadsheets.",
    },
  },
};

// Fix DE moments subtitle em dash to match PDF comma style - user said exact; use PDF "Maßgeschneiderte Ansichten für Ihr gesamtes Umfeld" + separate sentence
de.staticPages.features.momentsSubtitle =
  "Maßgeschneiderte Ansichten für Ihr gesamtes Umfeld. Erfahren Sie, wie CareTip den Alltag für Kunden, Teams, Führungskräfte und die Buchhaltung spürbar erleichtert.";

// --- pricing ---
de.staticPages.pricing = {
  ...de.staticPages.pricing,
  pageTitle: "Transparente Abrechnung – ohne Abo-Fallen",
  pageSubtitle:
    "Ihre Kunden zahlen nur das, was sie auch wirklich geben möchten. CareTip arbeitet garantiert ohne versteckte Abonnements oder wiederkehrende Rechnungen – jede Trinkgeld-Zahlung ist ein einmaliger, sicherer Vorgang.",
  sectionTitle: "Exzellenten Service in pure Wertschätzung verwandeln – mit CARETIP.",
  sectionSubtitle:
    "Caring is Tipping. Echte Anerkennung lebt von einfachen Wegen. Mit CareTip machen Sie den herausragenden Service Ihres Teams sichtbar und belohnen ihn direkt. Begeistern Sie Ihre Gäste, stärken Sie die Motivation Ihrer Mitarbeiter und binden Sie Kunden langfristig an Ihre Marke.",
  commitmentNotice: "Wählen Sie einfach das passende Paket für Ihren Betrieb.",
  commitmentTerms:
    "Alle Verträge werden mit einer Mindestvertragslaufzeit von 12 Monaten geschlossen, um Ihnen und Ihrem Team verlässliche Planungssicherheit zu garantieren. Es gelten die folgenden Einstiegspreise:",
  ctaTitle: "Haben Sie Fragen zu Ihrem Betrieb?",
  ctaBody:
    "Unser Team begleitet Sie Schritt für Schritt bei der Einrichtung, dem Branding und der Auswahl des passenden Tarifmodells für Ihren Service-, Pflege- oder Logistikbereich.",
};

en.staticPages.pricing = {
  ...en.staticPages.pricing,
  sectionTitle: "Turning excellent service into pure appreciation – with CARETIP.",
  sectionSubtitle:
    "Caring is Tipping. True recognition thrives on simplicity. With CareTip, you make your team's outstanding service visible and reward it directly. Delight your guests, boost employee motivation, and foster long-term brand loyalty.",
  commitmentNotice: "Choose the perfect plan tailored to your business needs.",
  commitmentTerms:
    "All plans feature a 12-month commitment to ensure continuous stability and planning security for your team. The following introductory prices apply:",
  ctaTitle: "Questions about your business?",
  ctaBody:
    "Our team will guide you step by step through setup, branding, and choosing the right fee model for your service, care, or logistics operation.",
};

console.log("Patched staticPages sections");
save("en.json", en);
save("de.json", de);
console.log("Done.");
