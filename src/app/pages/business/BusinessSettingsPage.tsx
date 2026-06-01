import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";
import { CareIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { GlobalAppLoadingHold } from "../../components/GlobalAppLoadingHold";
import { BusinessProfilePage } from "./BusinessProfilePage";
import {
  BUSINESS_SETTINGS_SECTIONS,
  parseBusinessSettingsSection,
  type BusinessSettingsSectionId,
} from "../../components/business/settings/businessSettingsSections";
import { BusinessSettingsGeneralPanel } from "../../components/business/settings/BusinessSettingsGeneralPanel";
import { BusinessSettingsSecurityPanel } from "../../components/business/settings/BusinessSettingsSecurityPanel";
import { BusinessSettingsNotificationsPanel } from "../../components/business/settings/BusinessSettingsNotificationsPanel";
import { BusinessSettingsBillingPanel } from "../../components/business/settings/BusinessSettingsBillingPanel";
import { BusinessSettingsShortcutsPanel } from "../../components/business/settings/BusinessSettingsShortcutsPanel";
import { useBusinessSettingsData } from "../../components/business/settings/useBusinessSettingsData";
import { businessUi } from "../../components/business/businessDashboardUi";

export function BusinessSettingsPage() {
  const { t } = useTranslation();
  const { user } = useRequireAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const section = parseBusinessSettingsSection(searchParams.get("section"));
  const settings = useBusinessSettingsData();

  const activeMeta = BUSINESS_SETTINGS_SECTIONS.find((s) => s.id === section)!;

  useEffect(() => {
    if (searchParams.get("section") === section) return;
    setSearchParams({ section }, { replace: true });
  }, [section, searchParams, setSearchParams]);

  const setSection = (id: BusinessSettingsSectionId) => {
    setSearchParams({ section: id }, { replace: false });
  };

  if (!user || user.role !== "business") {
    return <GlobalAppLoadingHold />;
  }

  return (
    <main className="bg-background px-4 pb-20 pt-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <CareIcon name="settings" size="md" className="shrink-0 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              {t("business.settings.eyebrow")}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("business.settings.title")}
          </h1>
          <p className={cn("mt-2 max-w-2xl sm:text-base", businessUi.cardDesc)}>
            {t("business.settings.subtitle")}
          </p>
        </header>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
          <nav
            className="lg:w-56 lg:shrink-0"
            aria-label={t("business.settings.navAria")}
          >
            <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {BUSINESS_SETTINGS_SECTIONS.map((item) => {
                const active = item.id === section;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSection(item.id)}
                    className={cn(
                      "inline-flex min-h-[44px] shrink-0 touch-manipulation items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-left text-sm font-medium transition-colors lg:w-full",
                      active
                        ? "border-primary/30 bg-primary/[0.06] text-foreground shadow-[0_4px_18px_-8px_rgba(15,23,42,0.08)]"
                        : cn(businessUi.cardStatic, "text-muted-foreground hover:border-neutral-200 hover:text-foreground"),
                    )}
                  >
                    <CareIcon
                      name={item.icon}
                      size="sm"
                      className={cn(active && "text-primary")}
                    />
                    <span className="whitespace-nowrap">{t(item.labelKey)}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="min-w-0 flex-1">
            <div className="mb-5 lg:hidden">
              <h2 className="text-lg font-semibold text-foreground">{t(activeMeta.labelKey)}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t(activeMeta.descriptionKey)}</p>
            </div>

            {section === "general" ? (
              <BusinessSettingsGeneralPanel {...settings} />
            ) : null}
            {section === "business" ? <BusinessProfilePage embedded /> : null}
            {section === "team" ? <BusinessSettingsShortcutsPanel variant="team" /> : null}
            {section === "notifications" ? <BusinessSettingsNotificationsPanel {...settings} /> : null}
            {section === "security" ? <BusinessSettingsSecurityPanel {...settings} /> : null}
            {section === "billing" ? <BusinessSettingsBillingPanel /> : null}
            {section === "branding" ? <BusinessSettingsShortcutsPanel variant="branding" /> : null}
          </div>
        </div>
      </div>
    </main>
  );
}
