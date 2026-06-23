import { memo } from "react";
import { QrCode, Copy, Check, MapPin, Printer, FileDown, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ProfileAvatar } from "../ui/profile-avatar";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Button } from "@/components/ui/button";
import { DASH_BTN_PRIMARY, DASH_BTN_SECONDARY } from "@/components/ui/dashboard-styles";
import { businessUi } from "@/app/components/business/businessDashboardUi";
import { cn } from "@/lib/utils";

export type QrManagementCardItem = {
  id: string;
  name: string;
  role?: string;
  avatar?: string | null;
  qrUrl: string;
  slug?: string | null;
};

type QrManagementCardProps = {
  item: QrManagementCardItem;
  type: "storefront" | "employee" | "table" | "location";
  previewDataUrl?: string;
  copiedId: string | null;
  qrLocked: boolean;
  regeneratingId: string | null;
  onCopy: (id: string, url: string) => void;
  onEmployeePrint?: (item: QrManagementCardItem, previewDataUrl?: string) => void;
  onEmployeePrintPdf?: (item: QrManagementCardItem) => void;
  onEmployeeRegenerate?: (item: QrManagementCardItem) => void;
  onVenuePrint?: (
    item: QrManagementCardItem,
    type: "storefront" | "table" | "location",
    previewDataUrl?: string,
  ) => void;
  onVenuePrintPdf?: (
    item: QrManagementCardItem,
    type: "storefront" | "table" | "location",
    previewDataUrl?: string,
  ) => void;
  onRegenerateBusinessQr?: () => void;
  exportBlocked?: boolean;
};

function QrPreviewImage({ dataUrl }: { dataUrl?: string }) {
  return (
    <div className="flex h-44 w-44 shrink-0 items-center justify-center rounded-lg border border-black/[0.10] bg-white p-1.5">
      {dataUrl ? (
        <img src={dataUrl} alt="" className="h-full w-full object-contain" decoding="async" />
      ) : (
        <QrCode className="h-20 w-20 text-foreground" />
      )}
    </div>
  );
}

export const QrManagementCard = memo(function QrManagementCard({
  item,
  type,
  previewDataUrl,
  copiedId,
  qrLocked,
  regeneratingId,
  onCopy,
  onEmployeePrint,
  onEmployeePrintPdf,
  onEmployeeRegenerate,
  onVenuePrint,
  onVenuePrintPdf,
  onRegenerateBusinessQr,
  exportBlocked = false,
}: QrManagementCardProps) {
  const { t } = useTranslation();

  return (
    <div className={cn(businessUi.cardStatic, businessUi.cardPad, "text-foreground")}>
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex-shrink-0">
          <QrPreviewImage dataUrl={previewDataUrl} />
          {exportBlocked ? (
            <p className="mt-2 text-center text-[10px] font-medium text-destructive">
              {t("business.qrReliability.exportBlockedShort")}
            </p>
          ) : null}
        </div>

        <div className="flex-1 space-y-4">
          <div>
            {type === "storefront" && (
              <div className="mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("business.qrStudio.gallery.mainVenueTitle")}
                </p>
                <p className="text-sm text-muted-foreground">{t("business.qrPage.storefrontCardHint")}</p>
              </div>
            )}
            {type === "employee" && (
              <div className="mb-2 flex items-center gap-3">
                <ProfileAvatar src={item.avatar} displayName={item.name} className="h-10 w-10" />
                <div>
                  <h3 className="font-semibold text-foreground">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.role}</p>
                </div>
              </div>
            )}
            {type === "table" && (
              <div>
                <h3 className="mb-1 font-semibold text-foreground">{item.name}</h3>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {item.role}
                </p>
              </div>
            )}
            {type === "location" && (
              <div>
                <h3 className="mb-1 font-semibold text-foreground">{item.name}</h3>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {item.role}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-black/[0.08] bg-muted/30 p-3">
            <p className="mb-1 text-xs text-muted-foreground">{t("business.qrPage.labelQrUrl")}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate font-mono text-xs text-foreground">{item.qrUrl}</code>
              <button
                type="button"
                onClick={() => onCopy(item.id, item.qrUrl)}
                className="flex-shrink-0 rounded-lg p-2 transition-colors hover:bg-background"
                aria-label={t("business.qrPage.copyUrlAria")}
              >
                {copiedId === item.id ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4 opacity-60" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex flex-wrap gap-2">
              {type === "employee" && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onEmployeePrint?.(item, previewDataUrl)}
                    disabled={qrLocked || exportBlocked}
                    className={DASH_BTN_SECONDARY}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    {t("business.qrPage.print")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onEmployeePrintPdf?.(item)}
                    disabled={qrLocked || !previewDataUrl || exportBlocked}
                    className={DASH_BTN_PRIMARY}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    {t("business.qrPage.downloadPdfLayout")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={item.slug ? "outline" : "default"}
                    onClick={() => onEmployeeRegenerate?.(item)}
                    disabled={qrLocked || regeneratingId === item.id}
                    className={item.slug ? DASH_BTN_SECONDARY : DASH_BTN_PRIMARY}
                  >
                    {regeneratingId === item.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {item.slug ? "Generate new" : "Generate profile link"}
                  </Button>
                </>
              )}
              {(type === "storefront" || type === "table" || type === "location") && (
                <>
                  {type === "storefront" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={onRegenerateBusinessQr}
                      disabled={qrLocked || regeneratingId === "storefront"}
                      className={DASH_BTN_SECONDARY}
                    >
                      {regeneratingId === "storefront" ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      {t("business.qrPage.regenerateBusinessQr")}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onVenuePrint?.(item, type, previewDataUrl)}
                    disabled={qrLocked || exportBlocked}
                    className={DASH_BTN_SECONDARY}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    {t("business.qrPage.print")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => onVenuePrintPdf?.(item, type, previewDataUrl)}
                    disabled={qrLocked || !previewDataUrl || exportBlocked}
                    className={DASH_BTN_PRIMARY}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    {t("business.qrPage.downloadPdfLayout")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
