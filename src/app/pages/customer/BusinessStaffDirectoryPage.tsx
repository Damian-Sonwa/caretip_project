import { useNavigate, useParams, Link } from "react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Building2, Home, Search } from "lucide-react";
import { useTipFlow } from "../../context/TipFlowContext";
import {
  getBusinessStaffDirectory,
  type BusinessDirectoryEmployee,
  type BusinessDirectoryResponse,
} from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import { CareTipLogo } from "../../components/CareTipLogo";
import { usePublicSocket } from "../../hooks/usePublicSocket";
import { useRealtimeFallback } from "../../hooks/useRealtimeFallback";
import { LiveConnectionBadge } from "../../components/LiveConnectionBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Path B: /business/:businessSlug — Business QR (staff directory).
 * Searchable grid of active employees; tap opens tip flow for that person.
 */
export function BusinessStaffDirectoryPage() {
  const navigate = useNavigate();
  const { businessSlug } = useParams<{ businessSlug: string }>();
  const { setBusinessId, setEmployee, setStaffProfileSlug } = useTipFlow();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BusinessDirectoryResponse | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const raw = businessSlug?.trim().toLowerCase();
    if (!raw) {
      setError("Invalid link.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getBusinessStaffDirectory(raw);
        if (cancelled) return;
        setData(res);
        setBusinessId(res.business.id);
      } catch (e) {
        logClientError("BusinessStaffDirectoryPage", e);
        if (!cancelled) {
          setError(toUserFriendlyMessage(e));
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessSlug, setBusinessId]);

  const filtered = useMemo(() => {
    const list = data?.employees ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (e) => e.name.toLowerCase().includes(q) || e.jobTitle.toLowerCase().includes(q)
    );
  }, [data?.employees, query]);

  const pickEmployee = (emp: BusinessDirectoryEmployee) => {
    if (!data) return;
    setBusinessId(data.business.id);
    setEmployee(emp.id, emp.name, emp.avatar ?? undefined);
    setStaffProfileSlug(emp.slug);
    const qs = new URLSearchParams({ employeeId: emp.id });
    if (emp.slug) {
      qs.set("returnSlug", emp.slug);
      qs.set("direct", "1");
    }
    navigate(`/tip-amount?${qs.toString()}`);
  };

  const businessIdForSocket = data?.business.id ?? null;
  const { socket, connected, connectionStatus } = usePublicSocket(businessIdForSocket);

  const reloadDirectory = useCallback(async () => {
    const raw = businessSlug?.trim().toLowerCase();
    if (!raw) return;
    try {
      const res = await getBusinessStaffDirectory(raw);
      setData(res);
      setBusinessId(res.business.id);
    } catch (e) {
      logClientError("BusinessStaffDirectoryPage.reload", e);
    }
  }, [businessSlug, setBusinessId]);

  useRealtimeFallback(connected, reloadDirectory, 60000);

  useEffect(() => {
    if (!socket || !data) return;
    const r = () => void reloadDirectory();
    socket.on("business_data_updated", r);
    socket.on("verification_updated", r);
    return () => {
      socket.off("business_data_updated", r);
      socket.off("verification_updated", r);
    };
  }, [socket, data, reloadDirectory]);

  if (loading) {
    return <CareTipPageLoader variant="wait" message="Loading team…" />;
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <p className="mb-2 text-center text-sm font-medium text-destructive">{error ?? "Not found"}</p>
        <Link to="/" className="text-sm text-primary hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="sticky top-0 z-10 border-b border-border/40 bg-background/95 backdrop-blur-lg shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-4 px-4 py-3.5 lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1280px] lg:px-8 xl:px-10 2xl:px-12">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="rounded-lg p-2 hover:bg-muted transition-colors"
            aria-label="Home"
          >
            <Home className="h-5 w-5 text-foreground" />
          </button>
          <CareTipLogo size="xs" className="shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-foreground">{data.business.name}</h1>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{data.business.type}</span>
              {data.business.location && (
                <>
                  <span>•</span>
                  <span>{data.business.location}</span>
                </>
              )}
            </div>
          </div>
          <LiveConnectionBadge status={connectionStatus} className="shrink-0" />
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 lg:max-w-6xl xl:max-w-7xl 2xl:max-w-[1280px] lg:px-8 xl:px-10 2xl:px-12 lg:space-y-8">
        <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="space-y-2">
          <h2 className="text-lg font-bold text-foreground">Choose who you'd like to thank</h2>
          <p className="text-sm text-muted-foreground">
            Every tip is recorded for transparency. You'll set the amount on the next screen.
          </p>
        </motion.div>

        <Card className="border border-border/50 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Search Team</CardTitle>
            <CardDescription>Filter by name or role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search by name or role…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                autoComplete="off"
              />
            </div>
          </CardContent>
        </Card>

        <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Card className="border border-border/50 shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Team Members</CardTitle>
              <CardDescription>Tap a team member to continue</CardDescription>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">No matches found.</p>
              ) : (
                <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {filtered.map((emp, index) => (
                    <motion.li
                      key={emp.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <button
                        type="button"
                        onClick={() => pickEmployee(emp)}
                        className="flex w-full flex-col items-center gap-3 rounded-2xl border border-border/50 bg-card p-4 text-left transition-all hover:border-primary/50 hover:shadow-lg hover:bg-muted/30"
                      >
                        <ProfileAvatar
                          src={emp.avatar}
                          displayName={emp.name}
                          className="h-20 w-20 ring-2 ring-primary/20 sm:h-24 sm:w-24"
                        />
                        <div className="min-w-0 text-center">
                          <span className="line-clamp-2 text-sm font-semibold leading-tight text-foreground">
                            {emp.name}
                          </span>
                          <span className="line-clamp-2 text-xs text-muted-foreground mt-1">{emp.jobTitle}</span>
                        </div>
                      </button>
                    </motion.li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <Card className="border border-border/50 bg-muted/20 shadow-sm">
          <CardContent className="flex items-center justify-center gap-2 py-4 text-center text-xs text-muted-foreground">
            Secure checkout on the next steps · CareTip Limited
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
