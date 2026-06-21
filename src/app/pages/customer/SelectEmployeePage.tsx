import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Star, Award } from "lucide-react";
import { useTipFlow } from "../../context/TipFlowContext";
import { getEmployees } from "../../lib/api";
import type { EmployeeItem } from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import { CareTipLogo } from "../../components/CareTipLogo";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEV_BYPASS_ENABLED, DEV_MOCK } from "../../lib/devCustomerBypass";
import { customerFlowUi as cf } from "./customerFlowUi";

export function SelectEmployeePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { businessId, setEmployee, setBusinessId, setTippingVenue } = useTipFlow();
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // DEV-only: allow opening /select-employee without QR context.
  useEffect(() => {
    if (!DEV_BYPASS_ENABLED) return;
    if (businessId) return;
    setBusinessId(DEV_MOCK.businessId);
    setTippingVenue(DEV_MOCK.venue);
  }, [businessId, setBusinessId, setTippingVenue]);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    const fetchEmployees = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getEmployees(businessId);
        setEmployees(data ?? []);
      } catch (err) {
        logClientError("SelectEmployeePage", err);
        setError(toUserFriendlyMessage(err));
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, [businessId]);

  const displayEmployees = employees.map((e) => ({
    id: e.id,
    name: e.name,
    role: e.role,
    avatar: e.avatar,
    rating: e.rating,
    tips: e.tips,
    topRated: e.topRated,
  }));

  const handleBack = () => {
    navigate(businessId ? `/qr-landing/${businessId}` : "/");
  };

  const handleContinue = () => {
    if (selectedEmployee) {
      const emp = displayEmployees.find((e) => e.id === selectedEmployee);
      if (emp) {
        setEmployee(String(emp.id), emp.name, emp.avatar ?? undefined);
        navigate(`/tip-amount?employeeId=${emp.id}`);
      }
    }
  };

  if (!businessId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6">
        <div className="mx-auto max-w-2xl space-y-4 text-center">
          <h1 className="text-xl font-semibold text-foreground">Start from a venue QR</h1>
          <p className="text-sm text-muted-foreground">
            Scan the CareTip QR at your table or counter so we know which team you are tipping. You can also open the
            link from your receipt or table card.
          </p>
          <button
            type="button"
            onClick={() => navigate("/")}
            className="w-full rounded-xl bg-accent px-4 py-3 font-semibold text-white shadow-lg transition-opacity hover:bg-accent/90"
          >
            Go to home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <CareTipPageLoader variant="wait" message={t("common.loadingTeamMembers")} />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="mb-2 text-sm font-medium text-destructive">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="text-sm text-primary hover:underline">
            {t("dashboard.tryAgain")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cf.pageWithBottomCta}>
      <div className={cf.stickyHeader}>
        <div className={cf.headerInner}>
          <button type="button" onClick={handleBack} className={cf.backButton}>
            {t("tipFlow.common.back")}
          </button>
          <CareTipLogo size="xs" className="shrink-0" />
          <div className="min-w-0 flex-1">
            <h1 className={cf.headline}>Select Team Member</h1>
            <p className={cf.subline}>Who provided your service?</p>
          </div>
        </div>
      </div>

      <div className={cf.main}>
        <Card className={cf.cardShadcn}>
          <CardHeader className={`${cf.cardHeaderPadding} pb-2`}>
            <CardTitle className={cf.cardTitle}>Choose who you&apos;re tipping</CardTitle>
            <CardDescription className={cf.cardDesc}>
              Preset amounts and payment are on the next steps. Pick the right person first.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-2 gap-4 sm:gap-5">
          {displayEmployees.length === 0 ? (
            <p className="col-span-2 py-12 text-center text-muted-foreground">No team members found.</p>
          ) : (
            displayEmployees.map((employee) => (
              <button
                key={employee.id}
                type="button"
                onClick={() => setSelectedEmployee(String(employee.id))}
                className={`${cf.employeeCard} relative overflow-hidden text-left ${
                  selectedEmployee === String(employee.id) ? cf.employeeCardSelected : ""
                }`}
              >
                {employee.topRated ? (
                  <div className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-full bg-accent px-2 py-1 text-xs text-white">
                    <Award className="h-3 w-3" />
                    <span>Top</span>
                  </div>
                ) : null}

                <div className="relative aspect-square bg-gradient-to-br from-primary/10 to-accent/10">
                  <ProfileAvatar
                    src={employee.avatar}
                    displayName={employee.name}
                    variant="square"
                    className="absolute inset-0 h-full w-full min-h-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                </div>

                <div className="space-y-2 p-3">
                  <div>
                    <h3 className="text-left text-sm font-semibold text-foreground">{employee.name}</h3>
                    <p className="text-left text-xs text-muted-foreground">{employee.role}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {employee.rating != null ? (
                        <>
                          <Star className="h-3 w-3 fill-accent text-accent" />
                          <span className="text-xs font-medium text-foreground">{employee.rating}</span>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">New Member</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{employee.tips} tips</span>
                  </div>
                </div>

                {selectedEmployee === String(employee.id) ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-[1.125rem] bg-primary/10">
                    <div className="flex size-10 items-center justify-center rounded-full bg-primary shadow-[0_6px_18px_rgba(233,120,28,0.28)]">
                      <svg className="size-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                ) : null}
              </button>
            ))
          )}
        </div>
      </div>

      {selectedEmployee ? (
        <div className={cf.fixedBottomBar}>
          <div className={cf.fixedBottomInner}>
            <button type="button" onClick={handleContinue} className={cf.btnPrimaryLg}>
              Continue to tip amount
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
