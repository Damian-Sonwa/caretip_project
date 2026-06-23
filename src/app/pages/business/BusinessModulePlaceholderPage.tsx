import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { businessUi } from "@/app/components/business/businessDashboardUi";

export function BusinessModulePlaceholderPage({
  titleKey,
  descriptionKey,
}: {
  titleKey: string;
  descriptionKey: string;
}) {
  const { t } = useTranslation();
  return (
    <Card className={businessUi.cardStatic}>
      <CardHeader>
        <CardTitle className="text-base">{t(titleKey)}</CardTitle>
        <CardDescription className={businessUi.cardDesc}>{t(descriptionKey)}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{t("business.moduleNav.comingSoon")}</p>
      </CardContent>
    </Card>
  );
}
