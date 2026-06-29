import { Link, useSearchParams } from "react-router";
import { Plus, Minus, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useMemo, useState } from "react";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { PublicTrustChips } from "@/components/public/PublicTrustChips";
import { publicPageUi } from "@/components/public/publicPageUi";
import { cn } from "@/lib/utils";

interface FAQItemProps {
  question: string;
  questionContent?: React.ReactNode;
  answer: string;
  answerContent?: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

function FaqAnswerWithLead({ lead, body }: { lead: string; body: string }) {
  return (
    <p className="text-sm leading-relaxed text-muted-foreground">
      <strong className="font-semibold text-foreground">{lead}</strong> {body}
    </p>
  );
}

function FAQItem({ question, questionContent, answer, answerContent, isOpen, onToggle }: FAQItemProps) {
  return (
    <div className={cn(publicPageUi.card, publicPageUi.cardInteractive, "caretip-faq-item overflow-hidden p-0")}>
      <button
        type="button"
        onClick={onToggle}
        className="caretip-faq-trigger flex w-full items-center justify-between text-left transition-colors hover:bg-muted/50"
      >
        <span className="caretip-faq-question pr-4 text-foreground">
          {questionContent ?? question}
        </span>
        {isOpen ? (
          <Minus className="h-5 w-5 shrink-0 text-primary" />
        ) : (
          <Plus className="h-5 w-5 shrink-0 text-muted-foreground" />
        )}
      </button>
      {isOpen ? (
        <div className="caretip-faq-answer-wrap border-t border-border/80">
          {answerContent ?? (
            <p className="caretip-faq-answer whitespace-pre-line">{answer}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

export function FAQPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const qFromUrl = searchParams.get("q") ?? "";
  const [searchQuery, setSearchQuery] = useState(qFromUrl);

  useEffect(() => {
    setSearchQuery(qFromUrl);
  }, [qFromUrl]);

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqItems = useMemo(() => {
    const raw = t("staticPages.faq.items", { returnObjects: true });
    const items = Array.isArray(raw) ? raw : [];
    type RawFaqItem = {
      q: string;
      qBefore?: string;
      qBold?: string;
      a?: string;
      aLead?: string;
      aBody?: string;
    };
    const parsed = items.filter(
      (item): item is RawFaqItem =>
        typeof item === "object" &&
        item !== null &&
        "q" in item &&
        typeof (item as RawFaqItem).q === "string",
    );
    return parsed.map((item) => {
      const questionContent =
        item.qBefore && item.qBold ? (
          <>
            {item.qBefore}
            <strong className="font-bold">{item.qBold}</strong>
          </>
        ) : undefined;

      if (item.aLead && item.aBody) {
        return {
          question: item.q,
          questionContent,
          answer: `${item.aLead} ${item.aBody}`,
          answerContent: <FaqAnswerWithLead lead={item.aLead} body={item.aBody} />,
        };
      }
      return { question: item.q, questionContent, answer: item.a ?? "" };
    });
  }, [t]);

  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return faqItems;
    return faqItems.filter((f) => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
  }, [searchQuery, faqItems]);

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
        title={t("staticPages.faq.pageTitle")}
        subtitle={t("staticPages.faq.pageSubtitle")}
        showTrustChips={false}
      />

      <div className={cn(publicPageUi.sectionGap, "flex justify-center")}>
        <PublicTrustChips variant="faq" className="justify-center" />
      </div>

      <div className={cn(publicPageUi.sectionGap, "relative max-w-xl")}>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("faq.searchPlaceholder")}
          autoComplete="off"
          aria-label={t("faq.searchAria")}
          className="w-full rounded-xl border border-border/90 bg-card py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className={cn(publicPageUi.sectionGap, "space-y-3")}>
        {filteredFaqs.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
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
              questionContent={"questionContent" in faq ? faq.questionContent : undefined}
              answer={faq.answer}
              answerContent={"answerContent" in faq ? faq.answerContent : undefined}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))
        )}
      </div>

      <section className={cn(publicPageUi.sectionGap, publicPageUi.ctaPanel)}>
        <h3 className="mb-2 text-2xl font-semibold text-foreground">
          {t("staticPages.faq.ctaTitle")}
        </h3>
        <p className="mx-auto mb-6 max-w-lg text-muted-foreground">{t("staticPages.faq.ctaBody")}</p>
        <Link to="/contact" className={publicPageUi.ctaPrimary}>
          {t("staticPages.faq.ctaButton")}
        </Link>
      </section>
    </PublicPageShell>
  );
}
