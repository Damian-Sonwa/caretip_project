import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { fetchBusinessBrandingSettings } from "../../../lib/api";
import { useSubscriptionEntitlements } from "../../../hooks/useSubscriptionEntitlements";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import { QrTemplatePicker } from "../../../components/business/settings/QrTemplatePicker";
import { UpgradeCta } from "../../../components/subscription/UpgradeCta";
import { DEFAULT_QR_TEMPLATE } from "../../../lib/qrTemplateStyles";
import type { QrTemplateId } from "../../../lib/qrTemplateStyles";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { businessUi } from "@/app/components/business/businessDashboardUi";
import { Loader2 } from "lucide-react";
import { logClientError } from "../../../lib/clientLog";

/** Premium QR template marketplace — preview + locked states. */
export function QrStudioTemplatesPage() {
  const { t } = useTranslation();
  const { user } = useRequireAuth();
  const { ready, hasFeature } = useSubscriptionEntitlements({
    enabled: user?.role === "business",
    role: user?.role === "business" ? "business" : null,
  });
  const canEdit = ready && hasFeature("brandingCustomization");
  const [loading, setLoading] = useState(true);
  const [template, setTemplate] = useState<QrTemplateId>(DEFAULT_QR_TEMPLATE);
  const [accent, setAccent] = useState("#EB992C");
  const [background, setBackground] = useState("#FFFFFF");
  const [displayName, setDisplayName] = useState("");
  const [tagline, setTagline] = useState("");

  useEffect(() => {
    let cancelled = false;
    void fetchBusinessBrandingSettings()
      .then((s) => {
        if (cancelled) return;
        setTemplate(s.qrTemplate);
        setAccent(s.qrAccentColor);
        setBackground(s.qrBackgroundColor);
        setDisplayName(s.brandDisplayName ?? user?.businessName ?? "");
        setTagline(s.brandTagline ?? "");
      })
      .catch((e) => logClientError("QrStudioTemplatesPage", e))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.businessName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        <span>{t("business.branding.loading")}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className={businessUi.cardStatic}>
        <CardHeader className="border-b border-neutral-100/90">
          <CardTitle className="text-base">{t("business.qrStudio.templates.title")}</CardTitle>
          <CardDescription className={businessUi.cardDesc}>
            {t("business.qrStudio.templates.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {!canEdit ? (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
              <p className="text-sm text-muted-foreground">{t("business.qrStudio.templates.basicHint")}</p>
              <div className="mt-3">
                <UpgradeCta featureKey="brandingCustomization" variant="secondary" />
              </div>
            </div>
          ) : null}
          <QrTemplatePicker
            value={template}
            onChange={setTemplate}
            canEdit={canEdit}
            accentColor={accent}
            backgroundColor={background}
            displayName={displayName || user?.businessName || "Your Brand"}
            tagline={tagline}
          />
          <p className="text-xs text-muted-foreground">{t("business.qrStudio.templates.saveHint")}</p>
          <Button asChild variant="outline" size="sm" className="w-fit">
            <Link to="/dashboard/qr-studio/branding">{t("business.qrStudio.templates.openBranding")}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
