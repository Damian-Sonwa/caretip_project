import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { ChevronLeft, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { createLocationAPI, fetchLocations, type LocationDTO } from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
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

const ACTION_TEAL = "#e9781c";

export function LocationsPage() {
  const { t } = useTranslation();
  const { isBusiness } = useRequireAuth();
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const load = useCallback(async () => {
    if (!isBusiness) {
      setLocations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await fetchLocations();
      setLocations(list);
    } catch (e) {
      logClientError("LocationsPage", e);
      toast.error(toUserFriendlyMessage(e));
      setLocations([]);
    } finally {
      setLoading(false);
    }
  }, [isBusiness]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error(t("business.locationsPage.toastNameRequired"));
      return;
    }
    setSaving(true);
    try {
      await createLocationAPI({
        name: trimmed,
        description: description.trim() || undefined,
      });
      toast.success(t("business.locationsPage.toastCreated"), {
        style: { background: ACTION_TEAL, color: "#fff" },
      });
      setModalOpen(false);
      setName("");
      setDescription("");
      await load();
    } catch (e) {
      logClientError("LocationsPage", e);
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
              aria-label={t("business.locationsPage.backAria")}
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{t("business.locationsPage.title")}</h1>
              <p className="text-sm text-muted-foreground">{t("business.locationsPage.subtitle")}</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => setModalOpen(true)}
            disabled={!isBusiness}
            className="shrink-0 w-full sm:w-auto"
            style={{ backgroundColor: ACTION_TEAL }}
          >
            {t("business.locationsPage.addNew")}
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <CareTipPageLoader variant="section" message={t("business.locationsPage.loading")} />
        ) : locations.length === 0 ? (
          <div className={cn(businessUi.cardStatic, "py-16 text-center text-muted-foreground border-dashed")}>
            <MapPin className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>{t("business.locationsPage.empty")}</p>
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {locations.map((loc) => (
              <li
                key={loc.id}
                className={cn(businessUi.cardStatic, "flex gap-3 items-start p-4")}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${ACTION_TEAL}20` }}
                >
                  <MapPin className="w-5 h-5" style={{ color: ACTION_TEAL }} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">{loc.name}</p>
                  {loc.description ? (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{loc.description}</p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("business.locationsPage.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("business.locationsPage.dialogDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="loc-name">{t("business.locationsPage.labelName")}</Label>
              <input
                id="loc-name"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder={t("business.locationsPage.placeholderName")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="off"
                data-lpignore="true"
                data-1p-ignore="true"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loc-desc">{t("business.locationsPage.labelDescription")}</Label>
              <textarea
                id="loc-desc"
                className="w-full min-h-[88px] rounded-lg border border-border bg-background px-3 py-2 text-sm resize-y"
                placeholder={t("business.locationsPage.placeholderDescription")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={saving}>
              {t("business.locationsPage.cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              style={{ backgroundColor: ACTION_TEAL }}
            >
              {saving ? <LoadingSpinner size="sm" /> : t("business.locationsPage.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
