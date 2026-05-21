import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft, Copy, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import {
  createTableAPI,
  fetchLocations,
  fetchTables,
  type LocationDTO,
  type TableDTO,
} from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { qrTableUrl } from "../../lib/appPublicUrl";
import { LoadingSpinner } from "../../components/ui/loading-spinner";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Button } from "../../components/ui/button";
import { cn } from "@/lib/utils";
import { businessUi } from "@/app/components/business/businessDashboardUi";

const TOAST_OK = { style: { background: "#e9932f", color: "#ffffff" } } as const;

export function TablesPage() {
  const { t } = useTranslation();
  const { isBusiness } = useRequireAuth();
  const [tables, setTables] = useState<TableDTO[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tableName, setTableName] = useState("");
  const [locationId, setLocationId] = useState("");

  const loadAll = useCallback(async () => {
    if (!isBusiness) {
      setLocations([]);
      setTables([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [locList, tblList] = await Promise.all([fetchLocations(), fetchTables()]);
      setLocations(locList);
      setTables(tblList);
      setLocationId((prev) => {
        if (prev && locList.some((l) => l.id === prev)) return prev;
        return locList[0]?.id ?? "";
      });
    } catch (e) {
      logClientError("TablesPage", e);
      toast.error(toUserFriendlyMessage(e));
      setLocations([]);
      setTables([]);
    } finally {
      setLoading(false);
    }
  }, [isBusiness]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const tableUrl = (tableId: string) => qrTableUrl(tableId);

  const copyLink = (tableId: string) => {
    void navigator.clipboard.writeText(tableUrl(tableId));
    toast.success(t("business.tablesPage.toastCopied"), TOAST_OK);
  };

  const handleSave = async () => {
    const trimmed = tableName.trim();
    if (!trimmed) {
      toast.error(t("business.tablesPage.toastNameRequired"));
      return;
    }
    if (!locationId) {
      toast.error(t("business.tablesPage.toastNeedLocation"));
      return;
    }
    setSaving(true);
    try {
      await createTableAPI({ name: trimmed, locationId });
      toast.success(t("business.tablesPage.toastCreated"), TOAST_OK);
      setModalOpen(false);
      setTableName("");
      await loadAll();
    } catch (e) {
      logClientError("TablesPage", e);
      toast.error(toUserFriendlyMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border sticky top-0 z-10 backdrop-blur-xl bg-card/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              to="/dashboard"
              className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground shrink-0"
              aria-label={t("business.tablesPage.backAria")}
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{t("business.tablesPage.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("business.tablesPage.subtitle")}</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => setModalOpen(true)}
            disabled={!isBusiness}
            className="w-full shrink-0 sm:w-auto"
          >
            {t("business.tablesPage.create")}
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <CareTipPageLoader variant="section" message={t("business.tablesPage.loading")} />
        ) : locations.length === 0 ? (
          <div className={cn(businessUi.cardStatic, "py-16 text-center text-muted-foreground border-dashed")}>
            <LayoutGrid className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="mb-4">{t("business.tablesPage.emptyNeedLocation")}</p>
            <Link
              to="/dashboard/locations"
              className="text-sm font-medium text-primary underline underline-offset-2"
            >
              {t("business.tablesPage.goToLocations")}
            </Link>
          </div>
        ) : tables.length === 0 ? (
          <div className={cn(businessUi.cardStatic, "py-16 text-center text-muted-foreground border-dashed")}>
            <LayoutGrid className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>{t("business.tablesPage.emptyNoTables")}</p>
          </div>
        ) : (
          <div className={cn(businessUi.tablePanel, "-mx-4 px-4 sm:mx-0 sm:px-0")}>
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <th className="px-4 py-3 font-medium text-foreground">{t("business.tablesPage.thTable")}</th>
                  <th className="px-4 py-3 font-medium text-foreground">{t("business.tablesPage.thLocation")}</th>
                  <th className="px-4 py-3 font-medium text-foreground">{t("business.tablesPage.thGuestLink")}</th>
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {tables.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{row.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{row.location.name}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs break-all text-muted-foreground">{tableUrl(row.id)}</code>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => copyLink(row.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-border hover:bg-muted"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {t("business.tablesPage.copy")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("business.tablesPage.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("business.tablesPage.dialogDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="table-loc">{t("business.tablesPage.labelLocation")}</Label>
              <select
                id="table-loc"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
              >
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="table-name">{t("business.tablesPage.labelTableName")}</Label>
              <input
                id="table-name"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder={t("business.tablesPage.placeholderTable")}
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              {t("business.tablesPage.cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || locations.length === 0}
              style={{ backgroundColor: "#e9932f" }}
            >
              {saving ? <LoadingSpinner size="sm" /> : t("business.tablesPage.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
