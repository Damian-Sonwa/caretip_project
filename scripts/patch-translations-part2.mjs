import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const localesDir = join(root, "src/i18n/locales");
const load = (n) => JSON.parse(readFileSync(join(localesDir, n), "utf8"));
const save = (n, d) => writeFileSync(join(localesDir, n), `${JSON.stringify(d, null, 2)}\n`);

const de = load("de.json");
const en = load("en.json");

// Landing showcase DE
Object.assign(de.landing.showcase, {
  heroHeadline: "In Sekunden zum Trinkgeld – Hervorragenden Service sofort belohnen.",
  heroTagline: "Caring is tipping",
  description:
    "Mit CareTip wird Trinkgeld geben so einfach wie nie zuvor. Ihre Teams sehen ihre Erfolge in Echtzeit, während Kunden, Patienten oder Gäste sich per schnellem QR-Code-Scan kontaktlos bedanken können.",
  primaryCta: "Jetzt Partner werden",
  secondaryCta: "Mitarbeiter-Portal",
  heroTitlePrefix: "",
  heroTitleEmphasis: "",
  heroTitleSuffix: "",
  heroTitleLine2: "",
  heroTitleLine2Prefix: "",
  heroTitleLine2Emphasis: "",
  heroRotatingWords: [],
  heroTitleLine2Suffix: "",
  heroTitleLine3: "",
});

Object.assign(en.landing.showcase, {
  heroHeadline: "Empowering our everyday heroes",
  heroTagline: "Caring is tipping",
  description:
    "Caring is Tipping: Reward outstanding dedication right in the moment. Make tipping effortlessly simple and fuel every single shift with noticeable motivation, genuine appreciation, and well-deserved smiles. Because the people who keep our world moving deserve nothing less than the best.",
  heroTitlePrefix: "",
  heroTitleEmphasis: "",
  heroTitleSuffix: "",
  heroTitleLine2: "",
  heroTitleLine2Prefix: "",
  heroTitleLine2Emphasis: "",
  heroRotatingWords: [],
  heroTitleLine2Suffix: "",
  heroTitleLine3: "",
});

de.landing.recognition = {
  title: "Für das Rückgrat unserer Gesellschaft",
  body: "Caring is Tipping: Belohnen Sie herausragenden Einsatz genau dann, wenn er passiert. Machen Sie das Geben von Trinkgeld spielend leicht und sorgen Sie für spürbar mehr Motivation, echte Anerkennung und ein Lächeln in jeder einzelnen Schicht. Weil die Menschen, die jeden Tag alles für uns geben, nur das Beste verdienen.",
};
en.landing.recognition = {
  title: "Empowering our everyday heroes",
  body: "Caring is Tipping: Reward outstanding dedication right in the moment. Make tipping effortlessly simple and fuel every single shift with noticeable motivation, genuine appreciation, and well-deserved smiles. Because the people who keep our world moving deserve nothing less than the best.",
};

de.landing.industries = {
  title: "Überall dort im Einsatz, wo Menschen Großartiges leisten",
  care: { name: "Pflege & Gesundheit (Care)", role: "" },
  delivery: { name: "Logistik & Lieferdienste (Delivery)", role: "" },
  hospitality: { name: "Gastgewerbe & Service (Hospitality)", role: "" },
  beauty: { name: "Friseur- & Beautysalons:", role: "" },
  craftHome: { name: "Handwerk & Hausservice:", role: "" },
  petCare: { name: "Tierpflege & Services:", role: "" },
};
en.landing.industries = {
  title: "Empowering excellence, wherever people care.",
  care: { name: "Healthcare & Nursing (Care)", role: "" },
  delivery: { name: "Logistics & Delivery Services (Delivery)", role: "" },
  hospitality: { name: "Hospitality & Guest Services (Hospitality)", role: "" },
  beauty: { name: "Hair & Beauty Salons (Beauty)", role: "" },
  craftHome: { name: "Trades & Home Services (Craft & Home)", role: "" },
  petCare: { name: "Pet Care & Services (Pet Care)", role: "" },
};

Object.assign(de.landing.hospitality, {
  title: "Für das Rückgrat unserer Gesellschaft",
  subtitle:
    "Caring is Tipping: Belohnen Sie herausragenden Einsatz genau dann, wenn er passiert. Machen Sie das Geben von Trinkgeld spielend leicht und sorgen Sie für spürbar mehr Motivation, echte Anerkennung und ein Lächeln in jeder einzelnen Schicht. Weil die Menschen, die jeden Tag alles für uns geben, nur das Beste verdienen.",
  pill: "Überall dort im Einsatz, wo Menschen Großartiges leisten",
  f1Title: "QR-Codes, die sich Ihrem Alltag anpassen",
  f1Text:
    "Ob am Tisch, auf Station oder direkt auf der Tour: Ausdrucken, aufstellen und sofort die Früchte der Arbeit ernten.",
  f2Title: "Voller Durchblick, null Diskussionen",
  f2Text:
    "Erfolge gemeinsam feiern! Sehen Sie live, was Ihr Team leistet – für eine absolut faire und transparente Auszahlung.",
  f3Title: "Bezahlen mit gutem Gefühl",
  f3Text:
    "Sicher, vertraut und blitzschnell. Machen Sie es Ihren Kunden so leicht wie nie zuvor, von Herzen Danke zu sagen.",
  f4Title: "Der tägliche Motivations-Boost",
  f4Text:
    "Echte Zahlen, echte Anerkennung. Verwandeln Sie jede Schicht in ein Erfolgserlebnis, das Ihr Team zusammenschweißt.",
  f5Title: "",
  f5Text: "",
});

Object.assign(en.landing.hospitality, {
  pill: "Empowering excellence, wherever people care.",
});

Object.assign(de.landing.simpleSetup, {
  pill: "In wenigen Minuten startklar",
  title: "In wenigen Minuten startklar",
  step1Title: "Account erstellen",
  step1Desc: "Ihr digitaler Workspace ist in weniger als einer Minute startklar.",
  step2Title: "Team einladen",
  step2Desc: "Mitarbeiter hinzufügen, Rollen verteilen – blitzschnell erledigt.",
  step3Title: "QR-Codes aktivieren",
  step3Desc: "Ausdrucken und genau dort platzieren, wo Ihre Kunden und Gäste sie sehen.",
  step4Title: "Wertschätzung empfangen",
  step4Desc: "Erleben Sie live im Dashboard, wie die ersten Beträge und Wertschätzungen eingehen.",
});

Object.assign(de.landing.employeeSection, {
  titleLine1: "Deinen Erfolg im Blick.",
  titleLine2: "Jeden Tag.",
  subtitle:
    "Erlebe live, wie jedes Trinkgeld eingeht, und verstehe genau, was deine besten Schichten ausmacht.",
  b1Title: "Einnahmen in Echtzeit",
  b1Text:
    "Sieh dabei zu, wie Trinkgelder eingehen, sobald Kunden, Patienten oder Gäste dir ihre Wertschätzung zeigen.",
  b2Title: "Performance-Insights",
  b2Text:
    "Erkenne Muster und Trends, die dir dabei helfen, jede Woche mehr aus deinen Schichten herauszuholen.",
  b3Title: "Verlauf & Bewertungen",
  b3Text:
    "Deine Trinkgelder und das Feedback deiner Gäste gesammelt an einem Ort – als digitaler Beweis für deine starke Arbeit.",
});

Object.assign(de.landing.businessSection, {
  titleLine1: "Volle Transparenz über Ihr gesamtes Team",
  titleLine2: "",
  subtitle:
    "Steuern Sie jeden Standort, jeden QR-Code und jede Auszahlung über ein einziges, übersichtliches Control Center.",
  b1Title: "Team-Performance in Echtzeit",
  b1Text:
    "Verfolgen Sie die Dynamik über verschiedene Schichten, Rollen und Standorte hinweg – live und im selben Moment.",
  b2Title: "Klare Trinkgeld-Verteilung",
  b2Text:
    "Behalten Sie den genauen Überblick, wo Trinkgelder landen, und vermeiden Sie Unklarheiten beim Schichtwechsel.",
  b3Title: "Exportierbare Berichte",
  b3Text: "Buchhaltungsfertige Exporte – perfekt vorbereitet für die Lohnabrechnung und Betriebsprüfungen.",
  b4Title: "Mitarbeiter- & QR-Verwaltung",
  b4Text: "Rollen, Zugriffsrechte und QR-Code-Zuweisungen nahtlos an einem zentralen Ort gebündelt.",
  cta: "Jetzt starten",
});

Object.assign(de.landing.features, {
  eyebrow: "Alles in einem System. Überall einsatzbereit.",
  title: "Alles in einem System. Überall einsatzbereit.",
  subtitle:
    "Individuelle QR-Codes, Analysen in Echtzeit und zentrale Standortkontrolle arbeiten Hand in Hand. Die smarte All-in-one-Plattform für moderne Betriebe.",
  i1Title: "Individuell & Gebrandet",
  i1Text: "Ein Scan im Look Ihrer Marke – und erstklassiger Service wird sofort belohnt.",
  i1Tag: "QR-Trinkgeldseiten",
  i2Title: "In Echtzeit",
  i2Text: "Einnahmen live im Blick: Der direkte Motivations-Boost von Schicht zu Schicht.",
  i2Tag: "Mitarbeiter-Dashboards",
  i3Title: "Voller Durchblick",
  i3Text: "Die Performance von Schichten, Rollen und allen Standorten auf einen Blick entschlüsselt.",
  i3Tag: "Business-Analysen",
  i4Title: "Exportbereit",
  i4Text: "Finanzamtskonforme Daten auf Knopfdruck – genau dann, wenn die Buchhaltung sie braucht.",
  i4Tag: "Lückenloser Trinkgeld-Verlauf",
  i5Title: "Flexibel & Direkt",
  i5Text: "Auszahlungen nach Ihrem eigenen Rhythmus – ohne lästigen Papierkram im Hintergrund.",
  i5Tag: "Smarte Auszahlungen",
  i6Title: "Echtes Feedback",
  i6Text: "Direkte Anerkennung von Kunden, Patienten oder Gästen, solange das Erlebnis noch frisch ist.",
  i6Tag: "Bewertungen & Lob",
});

Object.assign(de.landing.paymentsTrust, {
  title: "Maximale Sicherheit",
  subtitle: "Erstklassige Technologie für sichere Zahlungen",
  b1Title: "Apple Pay, Google Pay & Karte",
  b1Text:
    "Keine Hürden: Ihre Kunden nutzen einfach die Bezahlmethoden, die sie ohnehin täglich auf dem Smartphone haben.",
  b2Title: "Automatisch oder auf Abruf",
  b2Text:
    "Sie entscheiden, wann das Geld fließt – perfekt abgestimmt auf Ihre Buchhaltung und Ihre internen Prozesse.",
  b3Title: "100 % nachvollziehbar",
  b3Text:
    "Jeder Cent wird sauber erfasst. Sie erhalten rechtssichere Belege, die jeder Betriebsprüfung standhalten.",
  b4Title: "DSGVO- & PCI-konform",
  b4Text:
    "Sensible Zahlungsdaten werden ausschließlich verschlüsselt über zertifizierte Partner abgewickelt – absolut sicher und serverunabhängig.",
});

Object.assign(de.landing.realLife, {
  title: "CareTip im Alltag: So einfach funktioniert es",
  s1Headline: "Direkt an der Haustür",
  s1Tag: "Logistik & Paketdienstleistung",
  s1Text:
    "Kunden scannen den QR-Code auf dem Paket, dem Benachrichtigungsschein oder dem Fahrzeug und geben in Sekundenschnelle Trinkgeld. Ganz ohne App und komplett bargeldlos.",
  s1Detail:
    "Platzieren Sie Ihre individuellen QR-Codes gut sichtbar auf den Zustellfahrzeugen, den Handscannern, auf Benachrichtigungskarten oder direkt als Aufkleber auf den Sendungen. Der Kunde öffnet die Trinkgeldseite einfach im Smartphone-Browser, wählt den Wunschbetrag und zahlt sicher per Karte oder digitaler Wallet (Apple Pay / Google Pay). Egal, ob das Trinkgeld direkt dem jeweiligen Fahrer zugeordnet wird oder in einen gemeinsamen Pool für das gesamte Depot fließt: Ihr Dashboard aktualisiert sich in Echtzeit. So behält die Betriebsleitung auch an Tagen mit extrem hohem Paketaufkommen immer den perfekten Überblick über alle Eingänge und die Motivation im Team.",
  s2Headline: "Direkt am Front Desk",
  s2Tag: "Hotellerie & Rezeption",
  s2Text:
    "Ein kurzer Scan beim Check-in oder Check-out – die perfekte Lösung für Concierge, Gepäckservice und das gesamte Team. Ganz ohne Bargeld und diskret.",
  s2Detail:
    "Platzieren Sie Ihre individuellen QR-Codes gut sichtbar als Aufsteller am Empfang, auf Zimmerkarten-Hüllen oder als digitalen Link auf dem Tablet am Desk. Gäste belohnen den Gepäckservice, den Concierge oder das Housekeeping ganz unkompliziert, ohne mühsam nach passendem Bargeld oder Briefumschlägen suchen zu müssen. Ihre Buchhaltung sieht jede Transaktion gesammelt an einem Ort. Das macht Schichtübergaben absolut transparent und vereinfacht den Monatsabschluss im Hotel-Management massiv.",
  s3Headline: "Direkt auf dem Event",
  s3Tag: "Events & Hostess-Services",
  s3Text:
    "Ein kurzer Scan am Messestand oder beim Einlass – die perfekte Lösung für Hostessen, Promoter und Service-Crews. Mobil, professionell und sekundenschnell.",
  s3Detail:
    "Nutzen Sie individuelle QR-Codes als stilvolle Aufsteller an Infocountern, auf den Namensschildern (Badges) oder direkt als digitalen Code auf dem Smartphone. Kunden und Messebesucher belohnen erstklassigen Service, freundliche Beratung oder perfekten Support ganz unkompliziert und bargeldlos im Vorbeigehen. Die Agentur oder Projektleitung behält über das Dashboard live den Überblick über alle Einsätze. Das macht die Abrechnung nach dem Event absolut transparent und sorgt für maximal motivierte Teams auf jedem Kombieinsatz.",
  s4Headline: "Direkt beim Kunden vor Ort",
  s4Tag: "Außendienst & Hausbesuche",
  s4Text:
    "Trinkgeld von überall per Link oder QR-Code – die perfekte Lösung für Pflegekräfte, Handwerk und mobile Dienstleistungen. Unkompliziert und direkt nach der Arbeit.",
  s4Detail:
    "Senden Sie nach dem Termin einen persönlichen Link per SMS/WhatsApp oder zeigen Sie einen kompakten QR-Code auf Ihrer Visitenkarte. Kunden belohnen erstklassigen Service ganz bequem auf dem Sofa, selbst wenn sie nie ein physisches Geschäft betreten. Ihr Team im Außendienst bleibt maximal motiviert, weil die Wertschätzung nahtlos im selben System landet wie bei den Kollegen im Betrieb.",
});

Object.assign(en.landing.realLife, {
  title: "How CareTip works in real life",
  s1Headline: "Right at the Doorstep",
  s1Tag: "Logistics & Delivery",
  s1Text:
    "Customers scan the QR code on the vehicle, delivery notice, or parcel and tip in seconds. No app downloads, no cash needed.",
  s1Detail:
    "Display your custom QR codes on delivery vans, handheld scanners, missed-delivery cards, or as stickers directly on the packages. The customer opens the tipping screen instantly in their mobile browser, picks an amount, and pays securely using their card or preferred digital wallet. Whether the tip is assigned straight to the individual driver or contributed to a depot-wide pool, your dashboard updates in real time. Operations managers can track performance and boost driver motivation, even during peak delivery seasons.",
  s2Headline: "Right at Reception",
  s2Tag: "Hotels & Front Desk",
  s2Text:
    "A quick scan at check-in or check-out – the perfect solution for concierge, bell, and housekeeping teams. Seamless and completely cashless.",
  s2Detail:
    "Display your branded QR codes as countertop displays at the desk, on key card holders, or via a tablet link at reception. Guests can tip porters, the concierge, or housekeeping effortlessly, without hunting for spare cash or dealing with awkward tip envelopes. Finance sees every single transaction tracked in one central hub, making shift handovers and month-end reporting far simpler for hotel management.",
  s3Headline: "Right at the Event",
  s3Tag: "Events & Hostess Services",
  s3Text:
    "A quick scan at the exhibition booth or guest check-in – the ultimate solution for hostesses, promoters, and event crews. Mobile, professional, and cashless.",
  s3Detail:
    "Display your branded QR codes as sleek counter displays, print them onto event badges, or show them directly on a smartphone screen. Clients and event visitors can reward outstanding service, welcoming hospitality, or great support instantly, without needing cash. Agencies and project managers track every tip live in one central dashboard, making post-event accounting completely transparent while giving your crew a powerful motivation boost for every shift.",
  s4Headline: "On the Go, Right at the Door",
  s4Tag: "Mobile & Home Visits",
  s4Text:
    "Tip from anywhere via link or QR code – the ultimate solution for field services, home care, and mobile beauty. Seamless, instant, and completely cash-free.",
  s4Detail:
    "Send a personal tipping link via SMS or WhatsApp right after the job, or print a compact QR code on your business cards. Customers can reward great service from the comfort of their couch, even if your business doesn't have a physical storefront. Your field crew stays highly motivated because their appreciation lands in the exact same system as your in-venue staff.",
});

de.landing.motivation = {
  title: "Endlich die Anerkennung, die Ihr Team verdient.",
  subtitle:
    "Wer täglich vollen Einsatz zeigt, darf nicht unsichtbar bleiben. CareTip bringt Ihren Betrieb technisch auf die Überholspur: Machen Sie erstklassige Leistung sofort sichtbar und belohnen Sie Ihr Team mit unkompliziertem, digitalem Trinkgeld.",
};
en.landing.motivation = {
  title: "Built for those who work hard every single day.",
  subtitle:
    "For the hospitality, care, and delivery heroes who keep things running but are too often overlooked. CareTip puts your team in the fast lane, ensuring they get the digital recognition, visibility, and tips they truly deserve.",
};

Object.assign(de.landing.finalCta, {
  eyebrow: "In wenigen Minuten startklar",
  title: "Mehr Trinkgeld. Ab heute.",
  subtitle:
    "Bringen Sie Ihr Team noch heute auf die Überholspur. Ihre digitalen QR-Trinkgeldseiten sind im Handumdrehen eingerichtet – inklusive automatisierter Auszahlungen und voller Transparenz für Ihre Crew.",
});

de.footer.brandBlurb =
  "Das digitale Trinkgeld-System für moderne Teams. QR-Codes, automatisierte Auszahlungen und smarte Team-Analysen – alles vereint auf einer einzigen, sicheren Plattform.";
en.footer.brandBlurb =
  "The digital tipping system for modern teams. QR codes, automated payouts, and smart team analytics — united on one secure platform.";

// How it works DE
Object.assign(de.staticPages.howItWorks, {
  title: "So funktioniert’s",
  subtitle:
    "Die gesamte CareTip-Journey auf einen Blick: Richten Sie Ihr Konto ein, fügen Sie Ihr Team ein und legen Sie direkt los. Profitieren Sie von digitalem Trinkgeld, Sofort-Benachrichtigungen für Mitarbeiter, wertvolle Manager-Insights, schnelle Auszahlungen und messbaren Wachstum.",
  s1Title: "Erstellen Sie Ihr Konto",
  s1Body:
    "Registrieren Sie Ihren Business-Workspace in wenigen Minuten. Fügen Sie die Details Ihres Standorts hinzu, verifizieren Sie Ihr Konto und erhalten Sie ein übersichtliches Dashboard, das bereit für verschiedene Standorte, Personal und Auszahlungen ist.",
  s1TipLabel: "Quick Start:",
  s1TipBody:
    "Die meisten Teams schließen die Einrichtung in einem Durchgang ab. Es ist kein IT-Know how erforderlich",
  s2Title: "Team hinzufügen",
  s2Body:
    "Laden Sie Ihre Manager und Mitarbeiter ganz einfach per E-Mail oder über einen Einladungscode ein. Teilen Sie Ihr Team nach Standorten ein und weisen Sie feste Rollen zu, um sicherzustellen, dass jeder automatisch die korrekten Trinkgeld-Berechtigungen erhält.",
  s3Title: "QR-Codes generieren",
  s3Body:
    "Erstellen Sie individuelle QR-Codes im eigenen Markendesign für einzelne Mitarbeiter, Team-Pools oder bestimmte Tische. Nutzen Sie die Design-Vorschau, exportieren Sie druckfertige PDFs oder teilen Sie dynamische Links, wenn Sie keine gedruckten Codes benötigen.",
  s4Title: "QR-Codes an Tischen & Service-Points platzieren",
  s4Body:
    "Platzieren Sie die QR-Codes dort, wo Ihre Kunden, Patienten oder Angehörigen ganz natürlich interagieren: auf Stationen, Flyern, Aufstellern oder direkt auf der Dienstkleidung. CareTip fügt sich dezent und CI-konform in Ihren individuellen Arbeitsalltag und Ihr Erscheinungsbild ein.",
  s5Title: "Gäste scannen & geben Trinkgeld",
  s5Body:
    "Kunden, Patienten oder Angehörige scannen den Code einfach mit ihrer Smartphone-Kamera. Kein App-Download erforderlich. Sie wählen einen Betrag, zahlen bequem per Karte oder Digital Wallet und erhalten in Sekundenschnelle eine klare Bestätigung.",
  s5GuestLabel: "Browser-basiert",
  s5GuestBody:
    "Funktioniert direkt im mobilen Browser – ohne Hürden, direkt vor Ort, an der Haustür oder auf der Station.",
  s6Title: "Mitarbeiter erhalten das Trinkgelder sofort",
  s6Body:
    "Ihr Personal erhält Echtzeit-Benachrichtigungen, sobald ein Trinkgeld eingeht. Die Mitarbeiter sehen ihre aktuellen Einnahmen sowie alle Aktivitäten in ihrer digitalen Wallet – für das sichere Gefühl, dass großartiger Service sofort anerkannt wird.",
  s7Title: "Führungskräfte behalten die Performance im Blick",
  s7Body:
    "Inhaber, Stations- und Teamleiter überblicken die Trinkgelder ganz einfach nach Standort, Schicht oder Bereich. Übersichtliche Analytics-Widgets, Einblicke in besondere Team-Leistungen und Live-Aktivitäts-Feeds sorgen dafür, dass die Teams vor Ort und die Verwaltung stets optimal aufeinander abgestimmt sind.",
  s8Title: "Schnelle Auszahlungen & volle Transparenz",
  s8Body:
    "Die Einnahmen werden über sichere Zahlungsdienstleister direkt auf die hinterlegte Auszahlungsmethode überwiesen. Mitarbeiter, Einrichtungsleiter und die Buchhaltung behalten dabei dank klarer Statusanzeigen stets den Überblick: von „initiiert“ über „in Bearbeitung“ bis „ausgezahlt“.",
  s9Title: "Ihr Betrieb wächst durch spürbare Wertschätzung",
  s9Body:
    "Höhere Trinkgeldbeteiligung, zufriedenere Teams und eine stärkere Kundenbindung verstärken sich im Laufe der Zeit gegenseitig. CareTip hilft Ihnen dabei, das Engagement zu messen und positive Entwicklungen an jedem einzelnen Standort oder in jedem Team zu feiern.",
  s9stat1t: "+18 % – Höheres Trinkgeld-Engagement",
  s9stat1s: "",
  s9stat2t: "Spürbar gestärkt – Höhere Team-Moral und Mitarbeiterbindung",
  s9stat2s: "",
  trustTitle: "Voller Überblick und schnelle Auszahlungen für jedes Team",
  trust1Title: "Zahlungen, hinter denen Sie voll und ganz stehen können",
  trust1Body:
    "Kartendaten werden ausschließlich von zertifizierten Zahlungsdienstleistern verarbeitet. Alle Verbindungen nutzen moderne Verschlüsselungen, sodass die Zahlungen Ihrer Gäste und Ihre Unternehmensdaten durchgehend (Ende-zu-Ende) geschützt bleiben.",
  trust2Title: "Entwickelt für den dynamischen Servicebereich",
  trust2Body:
    "Die Web- und Mobilversionen bleiben jederzeit synchron. So sehen Manager und Mitarbeiter alle Updates sofort – egal, ob sie direkt vor Ort oder gerade unterwegs sind.",
  ctaTitle: "Bereit für die Einführung von digitalem Trinkgeld?",
  ctaBody:
    "Sehen Sie sich unsere Partnermodelle an – maßgeschneidert für Teams im Service-, Pflege- und Logistikbereich, vom einzelnen Standort bis hin zu überregionalen Unternehmensgruppen mit mehreren Betrieben.",
  ctaPricing: "Zu den Tarifen",
});

// How it works EN — PDF explicit English only (step 4 body)
Object.assign(en.staticPages.howItWorks, {
  s4Body:
    "Place your QR codes where your customers, patients, or relatives naturally interact: in care units, on flyers, displays, or directly on workwear. CareTip blends subtly and seamlessly into your daily operations and brand identity.",
});

// FAQ
de.staticPages.faq = {
  pageTitle: "Wir sind für Sie da.",
  pageSubtitle:
    "Sie haben Fragen zu CareTip oder möchten direkt starten? Unser Team berät Sie unverbindlich und persönlich.",
  whatIs: {
    title: "Was ist CareTip?",
    lead: "Die smarte Art, Danke zu sagen.",
    guests:
      "Für Ihre Gäste: Sie scannen einfach einen QR-Code, wählen das gewünschte Teammitglied oder den Pool aus und zahlen sekundenschnell per Karte oder Smartphone (Apple Pay/Google Pay).",
    business:
      "Für Sie als Betrieb: Sie verwalten Ihr Team, erstellen individuelle QR-Codes und erhalten rechtssichere Reports für die Buchhaltung – alles auf einer zentralen Plattform.",
    employees:
      "Für Ihre Mitarbeiter: Die Crew sieht jede eingegangene Wertschätzung und das verdiente Trinkgeld transparent im eigenen Account. Das sorgt für maximale Motivation und ein starkes Wir-Gefühl.",
  },
  items: [
    {
      q: "Müssen Gäste eine App herunterladen, um Trinkgeld zu geben?",
      a: "Nein, absolut nicht. Ihre Gäste scannen einfach den QR-Code oder klicken auf den Link und geben das Trinkgeld direkt im mobilen Browser ihres Smartphones. Es ist keinerlei App-Download oder Registrierung für den Gast nötig – der gesamte Prozess dauert nur wenige Sekunden.",
    },
    {
      q: "Wie erhalten die Mitarbeiter ihr Trinkgeld?",
      a: "Sicher, transparent und direkt. Alle Trinkgelder werden über zertifizierte, sichere Payment-Partner verarbeitet. Wie und wann die Auszahlung erfolgt, richtet sich ganz nach den individuellen Einstellungen Ihres Betriebs (z. B. als Direktauszahlung oder gesammelt im Pool). Mitarbeiter müssen lediglich einmalig ihr Profil und ihre Auszahlungsdaten in der CareTip-App vervollständigen – den Rest erledigt das System vollautomatisch.",
    },
    {
      q: "Ist die Zahlung über CareTip sicher?",
      a: "Ja, absolut. Sicherheit hat bei uns oberste Priorität. CareTip nutzt modernste Sicherheitsstandards der Branche und arbeitet ausschließlich mit zertifizierten Zahlungsanbietern zusammen, die die strengen PCI-DSS-Standards erfüllen. Sensible Kartendaten werden direkt und verschlüsselt von diesen Partnern verarbeitet – wir speichern zu keinem Zeitpunkt vollständige Kreditkartennummern auf unseren eigenen Servern.",
    },
    {
      q: "Welche Kosten entstehen für meinen Betrieb?",
      a: "Volle Transparenz ab Tag eins – garantiert ohne versteckte Gebühren. Die Kosten richten sich ganz nach dem von Ihnen gewählten CareTip-Tarifmodell. Es fallen lediglich die üblichen, transaktionsbasierten Bearbeitungsgebühren pro Trinkgeld an, die Sie detailliert auf unserer Preisseite oder in Ihrer individuellen Vereinbarung finden. Sie zahlen nur das, was beim Checkout oder der Registrierung offen ausgewiesen wird – keine Überraschungen, kein Risiko.",
    },
    {
      q: "Kann ich CareTip an mehreren Standorten nutzen?",
      a: "Ja, absolut. CareTip ist voll mandantenfähig und skaliert mit Ihrem Betrieb. Unsere höheren Tarifmodelle bieten umfassenden Support für mehrere Standorte sowie erweiterte Kontroll- und Administrationsrechte. Je nach Ihrer gewählten Vereinbarung können Sie Teams, Mitarbeiter und QR-Codes ganz flexibel und übersichtlich pro Standort individuell verwalten.",
    },
    {
      q: "Wie funktionieren die QR-Codes für mein Personal?",
      a: "Maximal flexibel und kinderleicht. Jedes Teammitglied, jede Rolle oder auch ein gemeinsamer Team-Pool erhält einen eigenen, individuellen QR-Code. Der Gast scannt den Code, wählt den Wunschbetrag aus und kann optional sogar direkt ein persönliches Feedback hinterlassen. Sie können die QR-Codes völlig flexibel platzieren: gedruckt auf Tischaufstellern, auf den Namensschildern der Mitarbeiter, auf Quittungen oder digital auf Displays.",
    },
    {
      q: "Was passiert, wenn ein Gast eine Zahlung anficht?",
      a: "Keine Sorge, wir lassen Sie dabei nicht allein. Kreditkartennetzwerke und Banken regeln Zahlungsstreitigkeiten (sogenannte Chargebacks) nach ihren Standardverfahren. Um den Fall schnellstmöglich zu klären, stellen wir den Zahlungsanbietern alle notwendigen und legitimen Transaktionsdetails zur Verfügung. Sollte es bei Ihnen zu einem konkreten Fall kommen, steht Ihnen unser Support-Team jederzeit zur Seite, um den Prozess für Sie so reibungslos wie möglich zu lösen.",
    },
    {
      q: "Sehen Mitarbeiter ihre Trinkgelder in Echtzeit?",
      a: "Ja, das ist der perfekte Motivations-Schub. CareTip kann Ihre Mitarbeiter sofort per Push-Benachrichtigung informieren, sobald ein neues Trinkgeld eingeht – je nach Ihren individuellen Betriebs-Einstellungen und der Netzabdeckung. Die genaue Sekunde der Zustellung kann sich je nach Endgerät und Mobilfunknetz minimal unterscheiden, aber die Transparenz ist ab der ersten Sekunde da.",
    },
    {
      q: "Kann ich meine Daten exportieren?",
      a: "Ja, das ist in unseren erweiterten Tarifen möglich. Während unser Basis-Modell für den einfachen Einstieg gedacht ist, können Betriebsinhaber und autorisierte Nutzer in den höheren Tarifmodellen alle relevanten Berichte und Finanzdaten unkompliziert exportieren. Sollten Sie für Compliance-Zwecke oder Audits einen vollständigen System-Datenexport benötigen, steht Ihnen unser Support-Team jederzeit zur Seite.",
    },
    {
      q: "Wie erreiche ich den Support, wenn ich Hilfe brauche?",
      a: "Wir sind für Sie da, wenn es brennt. Nutzen Sie einfach unser Help Center, die FAQs oder das Kontaktformular direkt auf unserer Website. Wir bieten schnellen E-Mail-Support und setzen alles daran, Ihnen während der regulären Geschäftszeiten so rasch wie möglich zu antworten. Für dringende Anliegen finden Sie in unserem Hilfe-Bereich zudem viele Lösungen zur sofortigen Selbsthilfe.",
    },
    {
      q: "Bietet CareTip eine mobile App an?",
      a: "Ja, absolut. CareTip bietet maßgeschneiderte mobile Lösungen für Ihr gesamtes Team. Mitarbeiter nutzen unsere App, um ihre Trinkgelder und Erfolge jederzeit im Blick zu behalten, während Betriebe smarte Mobile-Tools erhalten, um das Trinkgeld-Management auch von unterwegs flexibel zu steuern. Die Verfügbarkeit kann je nach Plattform variieren – alle Details und Downloads finden Sie auf unserer Infoseite für mobile Apps.",
    },
  ],
  ctaTitle: "Nicht die passende Antwort gefunden?",
  ctaBody: "Kein Problem – unser Support-Team hilft Ihnen gerne persönlich weiter.",
  ctaButton: "Jetzt Support kontaktieren",
};

en.staticPages.faq = {
  pageTitle: "We're here for you.",
  pageSubtitle: "Have questions about CareTip or ready to get started? Our team is happy to advise you personally and without obligation.",
  whatIs: {
    title: "What is CareTip?",
    lead: "The smart way to say thank you.",
    guests:
      "For your guests: they simply scan a QR code, choose the team member or pool, and pay in seconds by card or smartphone (Apple Pay/Google Pay).",
    business:
      "For your business: you manage your team, create individual QR codes, and receive compliant reports for accounting — all on one central platform.",
    employees:
      "For your employees: the crew sees every appreciation received and tips earned transparently in their own account. That drives motivation and a strong sense of team.",
  },
  items: [
    {
      q: "Do guests need to download an app to leave a tip?",
      a: "No, absolutely not. Guests can tip instantly from their mobile browser simply by scanning the QR code or clicking the link. No app downloads, accounts, or registrations are required for the guest tipping flow – it takes just a few seconds.",
    },
    {
      q: "How do employees get paid?",
      a: "Securely, transparently, and directly. All tips are processed through fully certified, secure payment partners. The exact payout timing and methods depend entirely on your specific business setup and preferences (e.g., direct individual payouts or split team pools). Employees simply need to complete their profile and payout details once within the CareTip app – the system handles the rest automatically.",
    },
    {
      q: "Is paying through CareTip secure?",
      a: "Yes, absolutely. Security is our top priority. CareTip utilizes industry-leading security practices and partners exclusively with payment processors that meet the highest PCI-DSS compliance standards. All card data is handled directly and securely by our partners; we never store full card numbers on our servers.",
    },
    {
      q: "What does it cost my business?",
      a: "Total transparency from day one – with absolutely zero hidden fees. Pricing depends entirely on the CareTip fee tier you choose. Standard, per-tip processing-style fees apply, which are clearly outlined on our Pricing page or in your specific agreement. There are never any hidden charges beyond what is explicitly disclosed at signup or checkout.",
    },
    {
      q: "Can I use CareTip at multiple locations?",
      a: "Yes, absolutely. CareTip is built to scale alongside your business. Our higher tiers offer robust multi-location support and advanced administrative controls. Depending on your specific agreement, you can easily manage staff, custom QR codes, and permissions separated by each individual location.",
    },
    {
      q: "How do QR codes work for staff?",
      a: "Maximum flexibility, zero effort. Every employee, specific role, or shared team pool gets their own unique QR Code. Guests simply scan the code, select their tipping amount, and can optionally leave a personal review or feedback. You can display these codes anywhere that fits your workflow: printed on table tents, on staff badges, directly on receipts, or digitally on screens.",
    },
    {
      q: "What if a guest disputes a charge?",
      a: "Don't worry, we've got your back. Card networks and banks handle payment disputes according to their standard regulatory rules. To help resolve any issues swiftly, we will share the necessary transaction details with the payment processors. If you ever face a specific case, our support team is right here to guide you through it and minimize the hassle for your business.",
    },
    {
      q: "Do employees see tips in real time?",
      a: "Yes, and it's a massive motivation booster. CareTip can notify your employees instantly when a new tip arrives, depending on your specific dashboard settings and their device connectivity. While the exact delivery second may vary slightly based on network speeds and devices, the transparency is there from day one.",
    },
    {
      q: "Can I export my data?",
      a: "Yes, this feature is available in our advanced tiers. While our basic plan is designed for getting started, business owners and authorized managers in our higher tiers can easily export reporting and financial data. If you require a full, comprehensive data export for compliance or specific accounting needs, our support team is right here to assist you.",
    },
    {
      q: "How do I get support?",
      a: "We're here to help whenever you need us. You can easily access our Help Center, browse our FAQs, or use the contact form on our website. We provide dedicated email support and aim to respond as quickly as possible during regular business hours. For immediate assistance, our Help Center also offers step-by-step guides to solve common issues instantly.",
    },
    {
      q: "Do you offer a mobile app?",
      a: "Yes, absolutely. CareTip offers tailored mobile experiences built for your entire team. Employees can use our app to track their tips and performance on the go, while businesses get smart mobile tools to manage tipping workflows from anywhere. Availability may vary by platform; please check our dedicated Mobile App page for full details and downloads.",
    },
  ],
  ctaTitle: "Can't find the answer you're looking for?",
  ctaBody: "No worries – our support team is right here to help.",
  ctaButton: "Contact Support",
};

// Prepend what-is as first FAQ display item handled in component

save("de.json", de);
save("en.json", en);
console.log("Part 2 done");
