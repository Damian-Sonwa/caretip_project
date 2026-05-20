import { Link, useSearchParams } from "react-router";
import { ArrowRight, Plus, Minus, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { publicPageUi } from "@/components/public/publicPageUi";
import { cn } from "@/lib/utils";

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

function FAQItem({ question, answer, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className={cn(publicPageUi.card, publicPageUi.cardInteractive, "overflow-hidden p-0")}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-neutral-50/80 sm:px-6 dark:hover:bg-neutral-900/50"
      >
        <span className="pr-4 font-semibold text-neutral-950 dark:text-neutral-50">{question}</span>
        {isOpen ? (
          <Minus className="h-5 w-5 shrink-0 text-primary" />
        ) : (
          <Plus className="h-5 w-5 shrink-0 text-neutral-500" />
        )}
      </button>
      {isOpen ? (
        <div className="border-t border-neutral-200/80 px-5 py-4 sm:px-6 dark:border-neutral-800">
          <p className="text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{answer}</p>
        </div>
      ) : null}
    </div>
  );
}

const FAQ_ITEMS = [
  {
    question: "What is Caretip?",
    answer:
      "Caretip is a digital tipping platform for hospitality businesses. Guests scan a QR code, choose who to tip, and pay with a card or digital wallet. Businesses manage staff, QR codes, and reporting; employees see tips and earnings in their account.",
  },
  {
    question: "Do guests need to download an app to leave a tip?",
    answer:
      "No. Guests can tip from their phone browser using a QR code or link. No app download is required for the guest tipping flow.",
  },
  {
    question: "How do employees get paid?",
    answer:
      "Tips are processed through secure payment partners. Payout timing and methods depend on your business setup, verification, and payout settings. Employees should complete any required profile or payout information in the app.",
  },
  {
    question: "Is paying through Caretip secure?",
    answer:
      "Caretip uses industry-standard security practices and works with payment processors that meet PCI standards. Card data is handled by those partners; we do not store full card numbers on our servers.",
  },
  {
    question: "What does it cost my business?",
    answer:
      "Pricing depends on the CareTip fee tier you choose. Per-tip processing-style fees apply as shown on our Pricing page or in your agreement. There are no hidden charges beyond what we disclose at signup or checkout.",
  },
  {
    question: "Can I use Caretip at multiple locations?",
    answer:
      "Yes. Higher business tiers support multiple locations and more advanced controls. You can manage staff and QR codes per location depending on your agreement.",
  },
  {
    question: "How do QR codes work for staff?",
    answer:
      "Each employee or role can have a QR code guests scan. Guests select an amount, tip, and optionally leave feedback. You can print or display codes digitally on tables, badges, or receipts.",
  },
  {
    question: "What if a guest disputes a charge?",
    answer:
      "Card networks and banks handle disputes according to their rules. We may share transaction details with processors to resolve issues. Contact support if you need help with a specific case.",
  },
  {
    question: "Do employees see tips in real time?",
    answer:
      "Caretip can notify employees when new tips arrive, depending on your settings and connectivity. Exact timing may vary by device and network.",
  },
  {
    question: "Can I export my data?",
    answer:
      "Business owners and authorized users may export reporting data where the product supports it. Contact support if you need a full data export for compliance.",
  },
  {
    question: "How do I get support?",
    answer:
      "Use the Help Center, FAQs, or contact form. We offer email support and aim to respond as quickly as possible during business hours.",
  },
  {
    question: "Do you offer a mobile app?",
    answer:
      "Caretip offers mobile experiences for employees and tools for businesses to manage tipping on the go. Availability may vary by platform; check the Mobile App page for details.",
  },
];

export function FAQPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const qFromUrl = searchParams.get("q") ?? "";
  const [searchQuery, setSearchQuery] = useState(qFromUrl);

  useEffect(() => {
    setSearchQuery(qFromUrl);
  }, [qFromUrl]);

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return FAQ_ITEMS;
    return FAQ_ITEMS.filter((f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
  }, [searchQuery]);

  useEffect(() => {
    setOpenIndex(filteredFaqs.length > 0 ? 0 : null);
  }, [searchQuery, filteredFaqs.length]);

  const setQuery = (v: string) => {
    setSearchQuery(v);
    const trimmed = v.trim();
    if (trimmed) setSearchParams({ q: trimmed }, { replace: true });
    else setSearchParams({}, { replace: true });
  };

  return (
    <PublicPageShell>
      <PublicPageHeader
        title="FAQs"
        subtitle="Frequently asked questions about digital tipping with Caretip."
        showTrustChips
      />

      <div className={cn(publicPageUi.sectionGap, "relative max-w-xl")}>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-neutral-500" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("faq.searchPlaceholder")}
          autoComplete="off"
          aria-label={t("faq.searchAria")}
          className="w-full rounded-xl border border-neutral-200/90 bg-white py-3 pl-12 pr-4 text-neutral-900 placeholder:text-neutral-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        />
      </div>

      <div className={cn(publicPageUi.sectionGap, "space-y-3")}>
        {filteredFaqs.length === 0 ? (
          <p className="py-8 text-center text-neutral-600 dark:text-neutral-400">
            {t("faq.noMatch")}{" "}
            <button
              type="button"
              className="font-medium text-primary underline underline-offset-2"
              onClick={() => setQuery("")}
            >
              {t("faq.clearSearch")}
            </button>
          </p>
        ) : (
          filteredFaqs.map((faq, index) => (
            <FAQItem
              key={faq.question}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))
        )}
      </div>

      <section className={cn(publicPageUi.sectionGap, publicPageUi.ctaPanel)}>
        <h3 className="mb-2 text-2xl font-semibold text-neutral-950 dark:text-neutral-50">Still have questions?</h3>
        <p className="mx-auto mb-6 max-w-lg text-neutral-700 dark:text-neutral-300">
          Can&apos;t find the answer you&apos;re looking for? Our support team is here to help.
        </p>
        <Link to="/contact" className={publicPageUi.ctaPrimary}>
          Contact Support
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </PublicPageShell>
  );
}
