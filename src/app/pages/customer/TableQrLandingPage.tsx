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
import { customerFlowUi as cf } from "./customerFlowUi";

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
      <div className={cf.stateCenter}>
        <p className={cf.stateError}>{error ?? t("tipFlow.common.notFound")}</p>
        <Link to="/" className="mt-4 text-sm font-semibold text-primary underline-offset-2 hover:underline">
          {t("tipFlow.common.goHomeLink")}
        </Link>
      </div>
    );
  }

  return (
    <div className={`${cf.page} pb-8 sm:pb-10`}>
      <div className={cf.stickyHeader}>
        <div className={cf.headerInner}>
          <button
            type="button"
            onClick={() => navigate("/")}
            className={cf.backButton}
            aria-label={t("tipFlow.common.homeAria")}
          >
            <Home className="h-5 w-5 text-foreground" />
          </button>
          <BusinessLogoMark logoPathOrUrl={data.business.logo} businessName={data.business.name} size="customer" />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <LayoutGrid className="h-3.5 w-3.5 shrink-0" />
              {t("tipFlow.tableLanding.tableLine", { name: data.table.name })}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {data.location.name}, {data.business.name}
              </span>
            </p>
            <h1 className={`${cf.headline} mt-1`}>{t("tipFlow.tableLanding.whoServedYou")}</h1>
          </div>
          <Building2 className="h-8 w-8 shrink-0 text-muted-foreground/75" aria-hidden />
        </div>
      </div>

      <div className={`${cf.main} lg:space-y-7`}>
        {repeatCandidate ? (
          <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Card className={cf.cardShadcn}>
              <CardContent className="p-5 sm:p-6">
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
                    className={`${cf.btnPrimaryLg} py-3.5 text-sm sm:flex-1`}
                  >
                    {t("tipFlow.qrLanding.tipAgain")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepeatDismissed(true)}
                    className={`${cf.btnSecondaryLg} py-3.5 text-sm sm:flex-1`}
                  >
                    {t("tipFlow.qrLanding.chooseDifferentStaff")}
                  </button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}

        <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Card className={cf.cardShadcn}>
            <CardHeader className={`${cf.cardHeaderPadding} pb-2`}>
              <CardTitle className={cf.cardTitle}>{t("tipFlow.tableLanding.tableTipping")}</CardTitle>
              <CardDescription className={cf.cardDesc}>{t("tipFlow.tableLanding.tableTippingDesc")}</CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        <Card className={cf.cardShadcn}>
          <CardHeader className={`${cf.cardHeaderPadding} pb-2`}>
            <CardTitle className={cf.cardTitle}>{t("tipFlow.tableLanding.searchTitle")}</CardTitle>
            <CardDescription className={cf.cardDesc}>{t("tipFlow.tableLanding.searchDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="search"
                placeholder={t("tipFlow.qrLanding.searchPlaceholder")}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`${cf.inputField} pl-11`}
                autoComplete="off"
              />
            </div>
          </CardContent>
        </Card>

        <Card className={cf.cardShadcn}>
          <CardHeader className={`${cf.cardHeaderPadding} pb-2`}>
            <CardTitle className={cf.cardTitle}>{t("tipFlow.tableLanding.teamTitle")}</CardTitle>
            <CardDescription className={cf.cardDesc}>{t("tipFlow.tableLanding.teamDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 sm:px-6">
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
                      className="flex w-full flex-col items-center gap-2 rounded-2xl border border-border/70 bg-card p-3 text-left shadow-[0_6px_22px_-14px_rgba(15,23,42,0.08)] transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-[0_10px_30px_-16px_rgba(15,23,42,0.11)] active:opacity-95"
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
