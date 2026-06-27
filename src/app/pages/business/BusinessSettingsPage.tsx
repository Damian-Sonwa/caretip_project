import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { CareIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { processBillingCheckoutSuccess } from "../../lib/subscriptionActivationNotification";
import { BusinessSubPageShellSkeleton } from "../../components/dashboard/BusinessSubPageShellSkeleton";
import { BusinessProfilePage } from "./BusinessProfilePage";
import {
  BUSINESS_SETTINGS_SECTIONS,
  legacySettingsSectionRedirectTarget,
  parseBusinessSettingsSection,
} from "../../components/business/settings/businessSettingsSections";
import { BusinessSettingsGeneralPanel } from "../../components/business/settings/BusinessSettingsGeneralPanel";
import { BusinessSettingsSecurityPanel } from "../../components/business/settings/BusinessSettingsSecurityPanel";
import { BusinessSettingsNotificationsPanel } from "../../components/business/settings/BusinessSettingsNotificationsPanel";
import { BusinessSettingsIntegrationsPanel } from "../../components/business/settings/BusinessSettingsIntegrationsPanel";
import { useBusinessSettingsData } from "../../components/business/settings/useBusinessSettingsData";
import { businessUi } from "@/app/components/business/businessDashboardUi";

export function BusinessSettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useRequireAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const rawSection = searchParams.get("section");
  const section = parseBusinessSettingsSection(rawSection);
  const settings = useBusinessSettingsData();

  useEffect(() => {
    const legacy = legacySettingsSectionRedirectTarget(rawSection);
    if (legacy) {
      const billing = searchParams.get("billing");
      const qs = billing ? `?billing=${billing}` : "";
      navigate(`${legacy}${qs}`, { replace: true });
    }
  }, [rawSection, searchParams, navigate]);

  useEffect(() => {
    const billing = searchParams.get("billing");
    if (!billing) return;
    if (billing === "success") {
      void processBillingCheckoutSuccess({
        t,
        sessionId: searchParams.get("session_id"),
      });
    } else if (billing === "canceled") {
      toast.message(t("business.billing.checkoutCanceled"));
    }
    navigate("/dashboard/billing/subscription", { replace: true });
  }, [searchParams, navigate, t]);

  const activeMeta = BUSINESS_SETTINGS_SECTIONS.find((s) => s.id === section)!;

  useEffect(() => {
    if (legacySettingsSectionRedirectTarget(rawSection)) return;
    if (searchParams.get("section") === section) return;
    setSearchParams({ section }, { replace: true });
  }, [section, searchParams, setSearchParams, rawSection]);

  if (!user || user.role !== "business") {
    return <BusinessSubPageShellSkeleton />;
  }

  return (
    <main className={businessUi.modulePageShell}>
      <div className={businessUi.modulePageContained}>
        <header className="business-settings-page-header">
          <div className="mb-2 flex items-center gap-2 text-muted-foreground">
            <CareIcon name="settings" size="md" className="shrink-0 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              {t("business.settings.eyebrow")}
            </span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t(activeMeta.labelKey)}
          </h1>
          <p className={cn("mt-2 max-w-2xl sm:text-base", businessUi.cardDesc)}>
            {t(activeMeta.descriptionKey)}
          </p>
        </header>

        <div className="min-w-0">
          {section === "general" ? <BusinessSettingsGeneralPanel {...settings} /> : null}
          {section === "business" ? <BusinessProfilePage embedded /> : null}
          {section === "notifications" ? <BusinessSettingsNotificationsPanel {...settings} /> : null}
          {section === "security" ? <BusinessSettingsSecurityPanel {...settings} /> : null}
          {section === "integrations" ? <BusinessSettingsIntegrationsPanel /> : null}
        </div>
      </div>
    </main>
  );
}
