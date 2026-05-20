import { useTranslation } from "react-i18next";
import { PublicLegalPageShell } from "@/components/public/PublicLegalPageShell";

export function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <PublicLegalPageShell title={t("staticPages.privacy.title")} subtitle={t("staticPages.privacy.lastUpdatedLine")}>
      <p>{t("staticPages.privacy.intro")}</p>

      <div className="space-y-6">
        <div>
          <h2>{t("staticPages.privacy.s1Title")}</h2>
          <p>{t("staticPages.privacy.s1Lead")}</p>
          <ul>
            <li>{t("staticPages.privacy.s1Li0")}</li>
            <li>{t("staticPages.privacy.s1Li1")}</li>
            <li>{t("staticPages.privacy.s1Li2")}</li>
            <li>{t("staticPages.privacy.s1Li3")}</li>
            <li>{t("staticPages.privacy.s1Li4")}</li>
          </ul>
          <p>{t("staticPages.privacy.s1Foot")}</p>
        </div>

        <div>
          <h2>{t("staticPages.privacy.s2Title")}</h2>
          <p>{t("staticPages.privacy.s2Lead")}</p>
          <ul>
            <li>{t("staticPages.privacy.s2Li0")}</li>
            <li>{t("staticPages.privacy.s2Li1")}</li>
            <li>{t("staticPages.privacy.s2Li2")}</li>
            <li>{t("staticPages.privacy.s2Li3")}</li>
            <li>{t("staticPages.privacy.s2Li4")}</li>
            <li>{t("staticPages.privacy.s2Li5")}</li>
            <li>{t("staticPages.privacy.s2Li6")}</li>
          </ul>
        </div>

        <div>
          <h2>{t("staticPages.privacy.s3Title")}</h2>
          <p>{t("staticPages.privacy.s3Lead")}</p>
          <ul>
            <li>{t("staticPages.privacy.s3Li0")}</li>
            <li>{t("staticPages.privacy.s3Li1")}</li>
            <li>{t("staticPages.privacy.s3Li2")}</li>
            <li>{t("staticPages.privacy.s3Li3")}</li>
          </ul>
          <p>{t("staticPages.privacy.s3Foot")}</p>
        </div>

        <div>
          <h2>{t("staticPages.privacy.s4Title")}</h2>
          <p>{t("staticPages.privacy.s4Body")}</p>
        </div>

        <div>
          <h2>{t("staticPages.privacy.s5Title")}</h2>
          <p>{t("staticPages.privacy.s5Lead")}</p>
          <ul>
            <li>{t("staticPages.privacy.s5Li0")}</li>
            <li>{t("staticPages.privacy.s5Li1")}</li>
            <li>{t("staticPages.privacy.s5Li2")}</li>
            <li>{t("staticPages.privacy.s5Li3")}</li>
            <li>{t("staticPages.privacy.s5Li4")}</li>
          </ul>
        </div>

        <div>
          <h2>{t("staticPages.privacy.s6Title")}</h2>
          <p>{t("staticPages.privacy.s6Body")}</p>
        </div>

        <div>
          <h2>{t("staticPages.privacy.s7Title")}</h2>
          <p>{t("staticPages.privacy.s7Body")}</p>
        </div>

        <div>
          <h2>{t("staticPages.privacy.s8Title")}</h2>
          <p>{t("staticPages.privacy.s8Body")}</p>
        </div>

        <div>
          <h2>{t("staticPages.privacy.s9Title")}</h2>
          <p>{t("staticPages.privacy.s9Body")}</p>
        </div>

        <div>
          <h2>{t("staticPages.privacy.s10Title")}</h2>
          <p>{t("staticPages.privacy.s10Body")}</p>
        </div>

        <div className="border-t border-neutral-200/80 pt-6 not-prose dark:border-neutral-800">
          <p className="text-sm text-neutral-700 dark:text-neutral-300">
            <strong className="text-neutral-950 dark:text-neutral-50">{t("staticPages.privacy.footerLastLabel")}</strong>{" "}
            {t("staticPages.privacy.footerLastDate")}
          </p>
          <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">{t("staticPages.privacy.footerContact")}</p>
        </div>
      </div>
    </PublicLegalPageShell>
  );
}
