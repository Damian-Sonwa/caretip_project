import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { usePublicScrollReveal } from "@/lib/usePublicScrollReveal";

type TrustCardProps = {
  index: number;
  title: string;
  body: string;
  delay?: number;
};

function AboutTrustBeliefCard({ index, title, body, delay = 0 }: TrustCardProps) {
  const reveal = usePublicScrollReveal<HTMLDivElement>(delay);

  return (
    <article
      ref={reveal.ref}
      style={reveal.style}
      className={cn(reveal.className, "caretip-about-belief-card")}
    >
      <span className="caretip-about-belief-card__index" aria-hidden>
        {index}
      </span>
      <h3 className="caretip-about-belief-card__title">{title}</h3>
      <p className="caretip-about-belief-card__body">{body}</p>
    </article>
  );
}

export function AboutTrustSection() {
  const { t, i18n } = useTranslation();
  const headerReveal = usePublicScrollReveal<HTMLDivElement>(0);

  const items = useMemo(
    () => [
      {
        title: t("staticPages.about.trustSection.t1Title"),
        body: t("staticPages.about.trustSection.t1Body"),
      },
      {
        title: t("staticPages.about.trustSection.t2Title"),
        body: t("staticPages.about.trustSection.t2Body"),
      },
      {
        title: t("staticPages.about.trustSection.t3Title"),
        body: t("staticPages.about.trustSection.t3Body"),
      },
    ],
    [t, i18n.language],
  );

  return (
    <section className="caretip-about-beliefs caretip-about-beliefs--trust" aria-labelledby="about-trust-title">
      <div className="caretip-about-page__inner">
        <div
          ref={headerReveal.ref}
          style={headerReveal.style}
          className={cn(headerReveal.className, "caretip-about-beliefs__head")}
        >
          <h2 id="about-trust-title" className="caretip-about-beliefs__title">
            {t("staticPages.about.trustSection.title")}
          </h2>
        </div>

        <div className="caretip-about-beliefs__grid">
          {items.map((item, idx) => (
            <AboutTrustBeliefCard
              key={item.title}
              index={idx + 1}
              title={item.title}
              body={item.body}
              delay={idx * 0.07}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
