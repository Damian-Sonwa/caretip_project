import { useNavigate, useParams, Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Building2, Home, MapPin, Search, LayoutGrid } from "lucide-react";
import { useTipFlow } from "../../context/TipFlowContext";
import {
  getPublicTableContextById,
  type BusinessDirectoryEmployee,
  type PublicTableContextResponse,
} from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import { CareTipLogo } from "../../components/CareTipLogo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepeatTipDataForBusiness } from "../../lib/repeatTip";
import { markCustomerFlowEntered } from "../../lib/customerFlowGuard";

/**
 * /qr/table/:tableId — Table QR by id: venue + table context, then same team selection as directory.
 */
export function TableQrLandingPage() {
  const navigate = useNavigate();
  const { tableId } = useParams<{ tableId: string }>();
  const { setBusinessId, setEmployee, setStaffProfileSlug, setTippingVenue, setAmount } = useTipFlow();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PublicTableContextResponse | null>(null);
  const [query, setQuery] = useState("");
  const [repeatDismissed, setRepeatDismissed] = useState(false);

  useEffect(() => {
    const raw = tableId?.trim();
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
        const res = await getPublicTableContextById(raw);
        if (cancelled) return;
        setData(res);
        setBusinessId(res.business.id);
        setTippingVenue({
          locationId: res.location.id,
          tableId: res.table.id,
          locationName: res.location.name,
          tableName: res.table.name,
          qrSlug: res.table.qrSlug,
        });
      } catch (e) {
        logClientError("TableQrLandingPage", e);
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
  }, [tableId, setBusinessId, setTippingVenue]);

  const filtered = useMemo(() => {
    const list = data?.employees ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.jobTitle.toLowerCase().includes(q)
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

  const repeatCandidate = useMemo(() => {
    if (!data?.business?.id || repeatDismissed) return null;
    const d = getRepeatTipDataForBusiness(data.business.id);
    if (!d) return null;
    const emp = (data.employees ?? []).find((e) => e.id === d.employeeId) ?? null;
    if (!emp) return null;
    return { emp, amount: d.lastAmount };
  }, [data?.business?.id, data?.employees, repeatDismissed]);

  if (loading) {
    return <CareTipPageLoader variant="wait" message="Loading table…" />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <p className="mb-2 text-center text-sm font-medium text-destructive">{error ?? "Not found"}</p>
        <Link to="/" className="text-primary hover:underline text-sm">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
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
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
              Table {data.table.name}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {data.location.name} · {data.business.name}
              </span>
            </p>
            <h1 className="mt-1 truncate text-lg font-semibold text-foreground">Who served you?</h1>
          </div>
          <Building2 className="h-8 w-8 shrink-0 text-muted-foreground opacity-80" />
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 lg:px-8">
        {repeatCandidate ? (
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Card className="border border-border shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">Welcome back</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Tip{" "}
                      <span className="font-semibold text-foreground">
                        {repeatCandidate.emp.name ?? "Team Member"}
                      </span>{" "}
                      again?
                    </p>
                    <p className="mt-2 text-xs font-semibold text-primary">
                      Last tip: €{repeatCandidate.amount.toFixed(2)}
                    </p>
                  </div>
                  <ProfileAvatar
                    src={repeatCandidate.emp.avatar}
                    displayName={repeatCandidate.emp.name ?? "Team Member"}
                    className="h-12 w-12 shrink-0 ring-2 ring-primary/20"
                  />
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setBusinessId(data.business.id);
                      setEmployee(
                        repeatCandidate.emp.id,
                        repeatCandidate.emp.name ?? "Team Member",
                        repeatCandidate.emp.avatar ?? undefined,
                      );
                      setStaffProfileSlug(repeatCandidate.emp.slug);
                      setAmount(repeatCandidate.amount);
                      markCustomerFlowEntered();
                      navigate("/payment");
                    }}
                    className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
                  >
                    Tip again
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepeatDismissed(true)}
                    className="w-full rounded-xl border border-border bg-background py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    Choose different staff
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}

        <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Table tipping</CardTitle>
              <CardDescription>
                Tap a team member to leave a tip. Your table is recorded for the venue.
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Search</CardTitle>
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
                className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                autoComplete="off"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Team</CardTitle>
            <CardDescription>Tap to continue to tip amount</CardDescription>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No matches.</p>
            ) : (
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
                      className="flex w-full flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-left transition-all hover:border-primary/50 hover:shadow-md"
                    >
                      <ProfileAvatar
                        src={emp.avatar}
                        displayName={emp.name}
                        className="h-20 w-20 ring-2 ring-primary/30"
                      />
                      <span className="line-clamp-2 text-center text-sm font-semibold leading-tight text-foreground">
                        {emp.name}
                      </span>
                      <span className="line-clamp-2 text-center text-xs text-muted-foreground">{emp.jobTitle}</span>
                    </button>
                  </motion.li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
