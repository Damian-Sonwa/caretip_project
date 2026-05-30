import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { CareIcon, type CareIconName } from "@/components/icons";
import { cn } from "@/lib/utils";
import { businessUi } from "@/app/components/business/businessDashboardUi";
import { BusinessSettingsPanelShell } from "./BusinessSettingsPanelShell";

type Shortcut = {
  titleKey: string;
  descKey: string;
  href: string;
  icon: CareIconName;
};

export function BusinessSettingsShortcutsPanel({ variant }: { variant: "team" | "branding" }) {
  const { t } = useTranslation();

  const shortcuts: Shortcut[] =
    variant === "team"
      ? [
          {
            titleKey: "business.settings.panels.teamCardTitle",
            descKey: "business.settings.panels.teamCardDesc",
            href: "/dashboard/staff-management",
            icon: "team",
          },
        ]
      : [
          {
            titleKey: "business.settings.panels.brandingCardTitle",
            descKey: "business.settings.panels.brandingCardDesc",
            href: "/dashboard/qr-code-management",
            icon: "tableQr",
          },
        ];

  const title =
    variant === "team"
      ? t("business.settings.panels.teamTitle")
      : t("business.settings.panels.brandingTitle");
  const description =
    variant === "team"
      ? t("business.settings.panels.teamDesc")
      : t("business.settings.panels.brandingDesc");

  return (
    <BusinessSettingsPanelShell title={title} description={description}>
      <ul className="space-y-3">
        {shortcuts.map((item) => (
          <li key={item.href}>
            <Link
              to={item.href}
              className="flex min-h-[44px] touch-manipulation items-center gap-4 rounded-xl border-2 border-border bg-muted/20 p-4 transition-colors hover:border-accent/40 hover:bg-muted/40"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <CareIcon name={item.icon} size="md" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{t(item.titleKey)}</span>
                <span className={cn("mt-0.5 block text-sm", businessUi.cardDesc)}>{t(item.descKey)}</span>
              </span>
              <CareIcon name="arrowRight" size="md" className="shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </BusinessSettingsPanelShell>
  );
}
