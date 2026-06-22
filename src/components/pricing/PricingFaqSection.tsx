import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { pricingPageUi } from "@/components/pricing/pricingPageUi";
import { cn } from "@/lib/utils";

export function PricingFaqSection({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const items = [0, 1, 2, 3].map((i) => ({
    q: t(`staticPages.pricing.faq.items.${i}.q`),
    a: t(`staticPages.pricing.faq.items.${i}.a`),
  }));

  return (
    <section className={cn("caretip-pricing-faq", className)} aria-labelledby="pricing-faq-heading">
      <header className="caretip-pricing-faq__header">
        <h2 id="pricing-faq-heading" className="caretip-pricing-faq__title">
          {t("staticPages.pricing.faq.title")}
        </h2>
        <p className="caretip-pricing-faq__subtitle">{t("staticPages.pricing.faq.subtitle")}</p>
      </header>

      <div className="caretip-pricing-faq__list">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={index} className="caretip-pricing-faq__item">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="caretip-pricing-faq__trigger"
                aria-expanded={isOpen}
              >
                <span className="caretip-pricing-faq__question">{item.q}</span>
                <ChevronDown
                  className={cn("caretip-pricing-faq__chevron", isOpen && "caretip-pricing-faq__chevron--open")}
                  aria-hidden
                />
              </button>
              {isOpen ? (
                <div className="caretip-pricing-faq__answer">
                  <p>{item.a}</p>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
