import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Users, UserCog, Search } from "lucide-react";
import { toast } from "sonner";
import { fetchPlatformBusinesses, impersonateManagerAPI, type PlatformBusinessRow } from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { useAuth, userFromAuthResponse } from "../../hooks/useAuth";
import { logClientError } from "../../lib/clientLog";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";

export function PlatformUserManagementPage() {
  const [rows, setRows] = useState<PlatformBusinessRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const { user, replaceUser } = useAuth();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPlatformBusinesses();
      setRows(res.businesses);
    } catch (e) {
      logClientError("PlatformUserManagementPage.load", e);
      toast.error(toUserFriendlyMessage(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        b.ownerEmail.toLowerCase().includes(q)
    );
  }, [rows, searchQuery]);

  const impersonate = async (b: PlatformBusinessRow) => {
    if (!user || user.role !== "platform_admin") return;
    setBusyId(b.id);
    try {
      const token = localStorage.getItem("caretip_token");
      const userJson = localStorage.getItem("caretip_user");
      if (token) sessionStorage.setItem("caretip_admin_token_backup", token);
      if (userJson) sessionStorage.setItem("caretip_admin_user_backup", userJson);

      const data = await impersonateManagerAPI(b.id);
      localStorage.setItem("caretip_token", data.token);
      replaceUser(userFromAuthResponse(data.user));
      toast.message(`Viewing dashboard as ${b.name}`);
      navigate("/dashboard");
    } catch (e) {
      logClientError("PlatformUserManagementPage.impersonate", e);
      sessionStorage.removeItem("caretip_admin_token_backup");
      sessionStorage.removeItem("caretip_admin_user_backup");
      toast.error(toUserFriendlyMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="px-4 lg:px-8 py-8 pb-20">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2 flex items-center gap-2">
                <Users className="w-7 h-7 text-accent" />
                User management
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Open a business dashboard as the venue manager to troubleshoot issues. Your admin session is saved. Use
                &quot;Exit impersonation&quot; from the business dashboard banner to return.
              </p>
            </div>

            <div className="relative mb-4 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by business name, slug, or manager email…"
                autoComplete="off"
                aria-label="Search businesses"
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card text-sm"
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left">
                      <th className="px-4 py-3 font-medium text-muted-foreground">Business</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Manager email</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Verification</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-10">
                          <CareTipPageLoader variant="compact" message="Loading…" />
                        </td>
                      </tr>
                    ) : filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground">
                          No businesses match your search.
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((b) => (
                        <tr key={b.id} className="border-b border-border/60 hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{b.name}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{b.ownerEmail}</td>
                          <td className="px-4 py-3 text-xs capitalize">{b.verificationStatus}</td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              disabled={busyId !== null}
                              onClick={() => void impersonate(b)}
                              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
                            >
                              <UserCog className="w-3.5 h-3.5" />
                              {busyId === b.id ? "Opening..." : "Impersonate manager"}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
    </main>
  );
}
