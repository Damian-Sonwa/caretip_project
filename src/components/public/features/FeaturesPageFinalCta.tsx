import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { publicPagesBrandUi } from "@/components/public/publicPagesBrandUi";

export function FeaturesPageFinalCta() {
  const { t } = useTranslation();

  return (
    <section className="caretip-features-cta-wise" aria-labelledby="features-cta-title">
      <div className="caretip-features-page__inner caretip-features-cta-wise__inner">
        <h2 id="features-cta-title" className="caretip-features-cta-wise__title">
          {t("staticPages.features.ctaTitle")}
        </h2>
        <div className="caretip-features-cta-wise__actions">
          <Link to="/signup" className={publicPagesBrandUi.ctaButtonPrimary}>
            {t("staticPages.features.ctaButton")}
          </Link>
        </div>
      </div>
    </section>
  );
}
