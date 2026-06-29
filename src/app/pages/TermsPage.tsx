import { useTranslation } from "react-i18next";
import { PublicLegalPageShell } from "@/components/public/PublicLegalPageShell";
import { publicPageUi } from "@/components/public/publicPageUi";
import { cn } from "@/lib/utils";

export function TermsPage() {
  const { t } = useTranslation();

  return (
    <PublicLegalPageShell title={t("staticPages.terms.title")} subtitle={t("staticPages.terms.subtitle")}>
      <div className="space-y-6">
        <div>
          <h2>{t("staticPages.terms.s1Title")}</h2>
          <p>{t("staticPages.terms.s1Body")}</p>
        </div>

        <div>
          <h2>{t("staticPages.terms.s2Title")}</h2>
          <p>{t("staticPages.terms.s2Lead")}</p>
          <ul>
            <li>{t("staticPages.terms.s2Li0")}</li>
            <li>{t("staticPages.terms.s2Li1")}</li>
            <li>{t("staticPages.terms.s2Li2")}</li>
            <li>{t("staticPages.terms.s2Li3")}</li>
          </ul>
        </div>

        <div>
          <h2>{t("staticPages.terms.s3Title")}</h2>
          <p>{t("staticPages.terms.s3Lead")}</p>
          <ul>
            <li>{t("staticPages.terms.s3Li0")}</li>
            <li>{t("staticPages.terms.s3Li1")}</li>
            <li>{t("staticPages.terms.s3Li2")}</li>
            <li>{t("staticPages.terms.s3Li3")}</li>
          </ul>
          <p>{t("staticPages.terms.s3Foot")}</p>
        </div>

        <div>
          <h2>{t("staticPages.terms.s4Title")}</h2>
          <p>{t("staticPages.terms.s4Lead")}</p>
          <ul>
            <li>{t("staticPages.terms.s4Li0")}</li>
            <li>{t("staticPages.terms.s4Li1")}</li>
            <li>{t("staticPages.terms.s4Li2")}</li>
            <li>{t("staticPages.terms.s4Li3")}</li>
          </ul>
        </div>

        <div>
          <h2>{t("staticPages.terms.s5Title")}</h2>
          <p>{t("staticPages.terms.s5Lead")}</p>
          <ul>
            <li>{t("staticPages.terms.s5Li0")}</li>
            <li>{t("staticPages.terms.s5Li1")}</li>
            <li>{t("staticPages.terms.s5Li2")}</li>
            <li>{t("staticPages.terms.s5Li3")}</li>
            <li>{t("staticPages.terms.s5Li4")}</li>
          </ul>
        </div>

        <div>
          <h2>{t("staticPages.terms.s6Title")}</h2>
          <p>{t("staticPages.terms.s6Body")}</p>
        </div>

        <div>
          <h2>{t("staticPages.terms.s7Title")}</h2>
          <p>{t("staticPages.terms.s7Body")}</p>
        </div>

        <div>
          <h2>{t("staticPages.terms.s8Title")}</h2>
          <p>{t("staticPages.terms.s8Body")}</p>
        </div>

        <div>
          <h2>{t("staticPages.terms.s9Title")}</h2>
          <p>{t("staticPages.terms.s9Body")}</p>
        </div>

        <div>
          <h2>{t("staticPages.terms.s10Title")}</h2>
          <p>{t("staticPages.terms.s10Body")}</p>
        </div>

        <div>
          <h2>{t("staticPages.terms.s11Title")}</h2>
          <p>{t("staticPages.terms.s11Body")}</p>
        </div>

        <div className={publicPageUi.legalFooter}>
          <p className={publicPageUi.legalFooterText}>
            <strong className={publicPageUi.legalFooterStrong}>{t("staticPages.terms.footerLastLabel")}</strong>{" "}
            {t("staticPages.terms.footerLastDate")}
          </p>
          <p className={cn("mt-3", publicPageUi.legalFooterText)}>{t("staticPages.terms.footerContact")}</p>
        </div>
      </div>
    </PublicLegalPageShell>
  );
}
