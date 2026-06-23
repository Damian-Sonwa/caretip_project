import { useTranslation } from "react-i18next";
import { useRequireAuth } from "../../../hooks/useRequireAuth";
import { useSubscriptionEntitlements } from "../../../hooks/useSubscriptionEntitlements";
import { QrStudioDesigner } from "../../../components/business/QrStudioDesigner";

/** QR Studio — premium branded experience designer. */
export function QrStudioBrandingPage() {
  const { t } = useTranslation();
  const { user } = useRequireAuth();
  const { ready, hasFeature } = useSubscriptionEntitlements({
    enabled: user?.role === "business",
    role: user?.role === "business" ? "business" : null,
  });

  return (
    <QrStudioDesigner
      businessId={user?.businessId}
      businessName={user?.businessName ?? t("dashboard.venueDashboardFallback")}
      canEdit={ready && hasFeature("brandingCustomization")}
    />
  );
}
