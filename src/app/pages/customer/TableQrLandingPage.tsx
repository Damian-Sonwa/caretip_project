import { useNavigate, useParams, Link } from "react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
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
import { BusinessLogoMark } from "../../components/business/BusinessLogoMark";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getRepeatTipDataForBusiness } from "../../lib/repeatTip";
import { markCustomerFlowEntered } from "../../lib/customerFlowGuard";
import { formatEur } from "../../lib/formatEur";

/**
 * /qr/table/:tableId — Table QR by id: venue + table context, then same team selection as directory.
 */
export function TableQrLandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { tableId } = useParams<{ tableId: string }>();
  const { setBusinessId, setEmployee, setStaffProfileSlug, setStaffTipReturnPath, setTippingVenue, setAmount } =
    useTipFlow();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PublicTableContextResponse | null>(null);
  const [query, setQuery] = useState("");
  const [repeatDismissed, setRepeatDismissed] = useState(false);

  useEffect(() => {
    const raw = tableId?.trim();
    if (!raw) {
      setError(t("tipFlow.errors.invalidLink"));
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
  }, [tableId, setBusinessId, setTippingVenue, t]);

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
    const qs = new URLSearchParams({ employeeId: emp.id });
    const bizSlug = data.business.slug?.trim();
    const empSlug = emp.slug?.trim();
    if (bizSlug && empSlug) {
      setStaffTipReturnPath(bizSlug, empSlug);
      qs.set("returnBusinessSlug", bizSlug);
      qs.set("returnEmployeeSlug", empSlug);
      qs.set("direct", "1");
    } else {
      setStaffProfileSlug(emp.slug ?? null);
      if (emp.slug) {
        qs.set("returnSlug", emp.slug);
        qs.set("direct", "1");
      }
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
    return <CareTipPageLoader variant="wait" message={t("tipFlow.tableLanding.loading")} />;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <p className="mb-2 text-center text-sm font-medium text-destructive">{error ?? t("tipFlow.common.notFound")}</p>
        <Link to="/" className="text-primary hover:underline text-sm">
          {t("tipFlow.common.goHomeLink")}
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
            aria-label={t("tipFlow.common.homeAria")}
          >
            <Home className="h-5 w-5 text-foreground" />
          </button>
          <BusinessLogoMark logoPathOrUrl={data.business.logo} businessName={data.business.name} size="md" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
              {t("tipFlow.tableLanding.tableLine", { name: data.table.name })}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {data.location.name} · {data.business.name}
              </span>
            </p>
            <h1 className="mt-1 truncate text-lg font-semibold text-foreground">
              {t("tipFlow.tableLanding.whoServedYou")}
            </h1>
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
                    <p className="text-sm font-semibold text-foreground">{t("tipFlow.qrLanding.repeatWelcome")}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("tipFlow.qrLanding.repeatBody", {
                        name: repeatCandidate.emp.name ?? t("tipFlow.common.teamMember"),
                      })}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-primary">
                      {t("tipFlow.qrLanding.repeatLastTip", { amount: formatEur(repeatCandidate.amount) })}
                    </p>
                  </div>
                  <ProfileAvatar
                    src={repeatCandidate.emp.avatar}
                    displayName={repeatCandidate.emp.name ?? t("tipFlow.common.teamMember")}
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
                        repeatCandidate.emp.name ?? t("tipFlow.common.teamMember"),
                        repeatCandidate.emp.avatar ?? undefined,
                      );
                      const bs = data.business.slug?.trim();
                      const es = repeatCandidate.emp.slug?.trim();
                      if (bs && es) setStaffTipReturnPath(bs, es);
                      else setStaffProfileSlug(repeatCandidate.emp.slug);
                      setAmount(repeatCandidate.amount);
                      markCustomerFlowEntered();
                      navigate("/payment");
                    }}
                    className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
                  >
                    {t("tipFlow.qrLanding.tipAgain")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepeatDismissed(true)}
                    className="w-full rounded-xl border border-border bg-background py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
                  >
                    {t("tipFlow.qrLanding.chooseDifferentStaff")}
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}

        <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("tipFlow.tableLanding.tableTipping")}</CardTitle>
              <CardDescription>{t("tipFlow.tableLanding.tableTippingDesc")}</CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        <Card className="border-border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("tipFlow.tableLanding.searchTitle")}</CardTitle>
            <CardDescription>{t("tipFlow.tableLanding.searchDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder={t("tipFlow.qrLanding.searchPlaceholder")}
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
            <CardTitle className="text-base">{t("tipFlow.tableLanding.teamTitle")}</CardTitle>
            <CardDescription>{t("tipFlow.tableLanding.teamDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t("tipFlow.tableLanding.noMatches")}</p>
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
