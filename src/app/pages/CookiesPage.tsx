import { useTranslation } from "react-i18next";
import { PublicLegalPageShell } from "@/components/public/PublicLegalPageShell";
import { publicPageUi } from "@/components/public/publicPageUi";
import { cn } from "@/lib/utils";

export function CookiesPage() {
  const { t } = useTranslation();

  const cookieType = (titleKey: string, bodyKey: string, liKeys: string[]) => (
    <div className={cn(publicPageUi.insetPanel, "not-prose")}>
      <h3 className={publicPageUi.legalInsetTitle}>{t(titleKey)}</h3>
      <p className="text-sm">{t(bodyKey)}</p>
      <ul className="ml-4 mt-2 list-disc space-y-1 text-sm">
        {liKeys.map((key) => (
          <li key={key}>{t(key)}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <PublicLegalPageShell title={t("staticPages.cookies.title")} subtitle={t("staticPages.cookies.subtitle")}>
      <div className="space-y-6">
        <div>
          <h2>{t("staticPages.cookies.whatTitle")}</h2>
          <p>{t("staticPages.cookies.whatBody")}</p>
        </div>

        <div>
          <h2>{t("staticPages.cookies.typesTitle")}</h2>
          <div className="not-prose mt-4 space-y-4">
            {cookieType("staticPages.cookies.essentialTitle", "staticPages.cookies.essentialBody", [
              "staticPages.cookies.essentialLi0",
              "staticPages.cookies.essentialLi1",
              "staticPages.cookies.essentialLi2",
            ])}
            {cookieType("staticPages.cookies.performanceTitle", "staticPages.cookies.performanceBody", [
              "staticPages.cookies.performanceLi0",
              "staticPages.cookies.performanceLi1",
              "staticPages.cookies.performanceLi2",
            ])}
            {cookieType("staticPages.cookies.functionalTitle", "staticPages.cookies.functionalBody", [
              "staticPages.cookies.functionalLi0",
              "staticPages.cookies.functionalLi1",
              "staticPages.cookies.functionalLi2",
            ])}
            {cookieType("staticPages.cookies.targetingTitle", "staticPages.cookies.targetingBody", [
              "staticPages.cookies.targetingLi0",
              "staticPages.cookies.targetingLi1",
              "staticPages.cookies.targetingLi2",
            ])}
          </div>
        </div>

        <div>
          <h2>{t("staticPages.cookies.thirdTitle")}</h2>
          <p>{t("staticPages.cookies.thirdLead")}</p>
          <ul>
            <li>{t("staticPages.cookies.thirdLi0")}</li>
            <li>{t("staticPages.cookies.thirdLi1")}</li>
            <li>{t("staticPages.cookies.thirdLi2")}</li>
            <li>{t("staticPages.cookies.thirdLi3")}</li>
          </ul>
        </div>

        <div>
          <h2>{t("staticPages.cookies.manageTitle")}</h2>
          <p>{t("staticPages.cookies.manageLead")}</p>
          <ul>
            <li>{t("staticPages.cookies.manageLi0")}</li>
            <li>{t("staticPages.cookies.manageLi1")}</li>
            <li>{t("staticPages.cookies.manageLi2")}</li>
          </ul>
          <p className="text-sm italic">{t("staticPages.cookies.manageNote")}</p>
        </div>

        <div>
          <h2>{t("staticPages.cookies.browserTitle")}</h2>
          <p>{t("staticPages.cookies.browserChrome")}</p>
          <p>{t("staticPages.cookies.browserFirefox")}</p>
          <p>{t("staticPages.cookies.browserSafari")}</p>
          <p>{t("staticPages.cookies.browserEdge")}</p>
        </div>

        <div>
          <h2>{t("staticPages.cookies.retentionTitle")}</h2>
          <p>{t("staticPages.cookies.retentionLead")}</p>
          <ul>
            <li>{t("staticPages.cookies.retentionLi0")}</li>
            <li>{t("staticPages.cookies.retentionLi1")}</li>
            <li>{t("staticPages.cookies.retentionLi2")}</li>
            <li>{t("staticPages.cookies.retentionLi3")}</li>
          </ul>
        </div>

        <div>
          <h2>{t("staticPages.cookies.updatesTitle")}</h2>
          <p>{t("staticPages.cookies.updatesBody")}</p>
        </div>

        <div className={publicPageUi.legalFooter}>
          <p className={publicPageUi.legalFooterText}>
            <strong className={publicPageUi.legalFooterStrong}>{t("staticPages.cookies.footerLastLabel")}</strong>{" "}
            {t("staticPages.cookies.footerLastDate")}
          </p>
          <p className={cn("mt-3", publicPageUi.legalFooterText)}>{t("staticPages.cookies.footerContact")}</p>
        </div>
      </div>
    </PublicLegalPageShell>
  );
}
