import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
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

const TOAST_OK = { style: { background: "#e9932f", color: "#ffffff" } } as const;

export function TablesPage() {
  const { isBusiness } = useRequireAuth();
  const [tables, setTables] = useState<TableDTO[]>([]);
  const [locations, setLocations] = useState<LocationDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tableName, setTableName] = useState("");
  const [locationId, setLocationId] = useState("");

  const loadAll = useCallback(async () => {
    if (!isBusiness) return;
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
    toast.success("Link copied.", TOAST_OK);
  };

  const handleSave = async () => {
    const trimmed = tableName.trim();
    if (!trimmed) {
      toast.error("Please enter a table name or number.");
      return;
    }
    if (!locationId) {
      toast.error("Create a location first, then add a table.");
      return;
    }
    setSaving(true);
    try {
      await createTableAPI({ name: trimmed, locationId });
      toast.success("Table created.", TOAST_OK);
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
              aria-label="Back to dashboard"
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Tables</h1>
              <p className="text-sm text-muted-foreground">Guest tipping QR codes per table</p>
            </div>
          </div>
          <Button
            type="button"
            onClick={() => setModalOpen(true)}
            disabled={!isBusiness}
            className="w-full shrink-0 sm:w-auto"
          >
            + Create Table
          </Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {loading ? (
          <CareTipPageLoader variant="section" message="Loading tables…" />
        ) : locations.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-border text-muted-foreground">
            <LayoutGrid className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="mb-4">Add a location first, then create tables under it.</p>
            <Link
              to="/dashboard/locations"
              className="text-sm font-medium text-primary underline underline-offset-2"
            >
              Go to Locations
            </Link>
          </div>
        ) : tables.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-border text-muted-foreground">
            <LayoutGrid className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p>No tables yet. Create one to get a guest QR link.</p>
          </div>
        ) : (
          <div className="-mx-4 overflow-x-auto rounded-xl border border-border px-4 sm:mx-0 sm:px-0">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  <th className="px-4 py-3 font-medium text-foreground">Table</th>
                  <th className="px-4 py-3 font-medium text-foreground">Location</th>
                  <th className="px-4 py-3 font-medium text-foreground">Guest link</th>
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody>
                {tables.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium text-foreground">{t.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.location.name}</td>
                    <td className="px-4 py-3">
                      <code className="text-xs break-all text-muted-foreground">{tableUrl(t.id)}</code>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => copyLink(t.id)}
                        className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-border hover:bg-muted"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy
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
            <DialogTitle>Create table</DialogTitle>
            <DialogDescription>
              Assign a table to a location. Guests will scan the QR to open the tipping flow for this table.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="table-loc">Location</Label>
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
              <Label htmlFor="table-name">Table name / number</Label>
              <input
                id="table-name"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder="e.g. 12 or Patio 3"
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
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving || locations.length === 0}
            >
              {saving ? <LoadingSpinner size="sm" /> : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
