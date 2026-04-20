import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { useState, useEffect } from "react";
import { ChevronLeft, Star, Award } from "lucide-react";
import { useTipFlow } from "../../context/TipFlowContext";
import { getEmployees } from "../../lib/api";
import type { EmployeeItem } from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import { CareTipLogo } from "../../components/CareTipLogo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DEV_BYPASS_ENABLED, DEV_MOCK } from "../../lib/devCustomerBypass";

export function SelectEmployeePage() {
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
    return <CareTipPageLoader variant="wait" message="Loading team members…" />;
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="mb-2 text-sm font-medium text-destructive">{error}</p>
          <button type="button" onClick={() => window.location.reload()} className="text-sm text-primary hover:underline">
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <div className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-4">
          <button
            type="button"
            onClick={handleBack}
            className="rounded-lg p-2 hover:bg-muted transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-foreground" />
          </button>
          <CareTipLogo size="xs" className="shrink-0" />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground">Select Team Member</h1>
            <p className="text-xs text-muted-foreground">Who provided your service?</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 lg:px-8">
        <motion.div initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Choose who you&apos;re tipping</CardTitle>
              <CardDescription>
                Preset amounts and payment are on the next steps — pick the right person first.
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          {displayEmployees.length === 0 ? (
            <p className="col-span-2 py-12 text-center text-muted-foreground">No team members found.</p>
          ) : (
            displayEmployees.map((employee, index) => (
              <motion.button
                key={employee.id}
                type="button"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => setSelectedEmployee(String(employee.id))}
                className={`relative overflow-hidden rounded-xl border-2 bg-card text-left shadow-sm transition-all ${
                  selectedEmployee === String(employee.id)
                    ? "border-accent shadow-lg shadow-accent/20"
                    : "border-border hover:border-accent/50"
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
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl border-2 border-accent bg-accent/10">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                ) : null}
              </motion.button>
            ))
          )}
        </div>
      </div>

      {selectedEmployee ? (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="fixed bottom-0 left-0 right-0 border-t border-border bg-background p-4"
        >
          <div className="mx-auto max-w-2xl">
            <button
              type="button"
              onClick={handleContinue}
              className="w-full rounded-xl bg-accent py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-accent/90"
            >
              Continue to tip amount
            </button>
          </div>
        </motion.div>
      ) : null}
    </div>
  );
}
