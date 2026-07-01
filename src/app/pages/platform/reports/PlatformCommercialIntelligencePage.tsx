import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { TrendingUp } from "lucide-react";
import { PlatformPage, PlatformPageHeader } from "../../../components/platform/PlatformPageChrome";
import { PlatformCommercialIntelligenceSection } from "../../../components/platform/PlatformCommercialIntelligenceSection";

export function PlatformCommercialIntelligencePage() {
  const { t } = useTranslation();
  return (
    <PlatformPage>
      <PlatformPageHeader
        icon={TrendingUp}
        title={t("admin.commercial.title")}
        subtitle={t("admin.commercial.desc")}
      />
      <Suspense fallback={null}>
        <PlatformCommercialIntelligenceSection />
      </Suspense>
    </PlatformPage>
  );
}
