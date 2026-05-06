import { motion } from "motion/react";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  ChevronLeft,
  Search,
  Plus,
  Star,
  Edit,
  QrCode,
  Mail,
  Phone,
  KeyRound,
  Copy,
  RefreshCw,
  Trash2,
  Users,
  ArrowRight,
  LayoutGrid,
  MapPin,
} from "lucide-react";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { useSocket } from "../../hooks/useSocket";
import { useRealtimeFallback } from "../../hooks/useRealtimeFallback";
import {
  generateInviteCode,
  getBusinessStats,
  fetchBusinessProfile,
  createEmployee,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
  fetchLocations,
  fetchTables,
  type LocationDTO,
  type TableDTO,
} from "../../lib/api";
import { formatEur } from "../../lib/formatEur";
import { downloadBrandedQR, downloadBrandedQRLegacy } from "../../lib/qrBranded";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  dashStatCard,
  DASH_BTN_PRIMARY,
  DASH_BTN_SECONDARY,
  DASH_EMPTY_ICON,
  DASH_EMPTY_STATE,
} from "@/components/ui/dashboard-styles";

const TOAST_OK = { style: { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } } as const;
const TOAST_ERR = { style: { background: "#d4183d", color: "#ffffff" } } as const;

function toastOk(message: string) {
  toast.success(message, TOAST_OK);
}

function toastErr(message: string) {
  toast.error(message, TOAST_ERR);
}

type StaffRow = {
  id: string;
  slug: string | null;
  name: string;
  role: string;
  avatar: string | null;
  tips: number;
  rating: number | null;
  email: string;
  phone: string;
  joinedDate: string;
  growth: string;
  isActive: boolean;
  activationStatus?: "active" | "pending_activation" | "pending_verification";
  emailVerified?: boolean;
  /** From API: password or OAuth present on `User`. */
  passwordIsSet?: boolean;
  monthlyGoal: number | null;
  locationId: string | null;
  assignedTableIds: string[];
};

function isFullyOnboardedDashboardStaff(emp: StaffRow): boolean {
  return emp.isActive === true && emp.activationStatus === "active";
}

/**
 * Onboarding hints only when the database still indicates work left
 * (do not infer from `activation_status` alone — e.g. script-updated `email_verified` / password rows).
 */
function staffRosterStatusNote(emp: StaffRow): string | null {
  if (!emp.isActive) return "Deactivated";
  if (isFullyOnboardedDashboardStaff(emp)) return null;
  const emailOk = emp.emailVerified === true;
  const pwdOk = emp.passwordIsSet === true;

  if (emp.activationStatus === "pending_verification") {
    if (!emailOk) return "Awaiting email verification";
    return null;
  }
  if (emp.activationStatus === "pending_activation") {
    if (!pwdOk) return "Pending password setup";
    return null;
  }
  return null;
}

function rosterNoteClassName(note: string | null): string {
  if (!note) return "";
  if (note === "Deactivated") return "text-xs font-medium text-muted-foreground mt-0.5";
  return "text-xs font-medium text-amber-700 dark:text-amber-500 mt-0.5";
}

export function StaffManagementPage() {
  const { user, isBusiness, authHydrated, sessionValidated } = useRequireAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    role: "Server",
    email: "",
    phone: "",
    locationId: "",
    tableIds: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inviteExpiresAt, setInviteExpiresAt] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [employees, setEmployees] = useState<StaffRow[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    role: "Server",
    email: "",
    monthlyGoal: "" as string,
    isActive: true,
    locationId: "",
    tableIds: [] as string[],
  });
  const [venueOptions, setVenueOptions] = useState<LocationDTO[]>([]);
  const [tableOptions, setTableOptions] = useState<TableDTO[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StaffRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [businessPublicSlug, setBusinessPublicSlug] = useState<string | null>(null);

  const canUseQr =
    Boolean(user?.impersonation) || user?.status === "APPROVED";

  const fetchEmployees = useCallback(async (opts?: { quiet?: boolean }) => {
    const quiet = opts?.quiet === true;
    if (!authHydrated || !sessionValidated) {
      if (!quiet) {
        setLoading(false);
      }
      return;
    }
    if (!user?.businessId) {
      if (!quiet) {
        setLoading(false);
        setEmployees([]);
        setError(null);
      }
      return;
    }
    if (!quiet) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await getBusinessStats("all");
      const empList = data.employees ?? [];
      const mapped: StaffRow[] = empList.map((e) => ({
        id: e.id,
        slug: e.slug ?? null,
        name: e.name,
        role: e.jobTitle,
        avatar: e.avatar,
        tips: e.tipsTotal,
        rating: e.rating,
        email: e.email ?? "",
        phone: e.phone ?? "",
        joinedDate: "",
        growth: "",
        isActive: e.isActive ?? true,
        activationStatus: e.activationStatus,
        emailVerified: e.emailVerified,
        passwordIsSet: e.passwordIsSet,
        monthlyGoal: e.monthlyGoal ?? null,
        locationId: e.locationId ?? null,
        assignedTableIds: e.assignedTableIds ?? [],
      }));
      setEmployees(mapped);
    } catch (err) {
      logClientError("StaffManagementPage", err);
      if (!quiet) {
        setError(toUserFriendlyMessage(err));
        setEmployees([]);
      }
    } finally {
      if (!quiet) setLoading(false);
    }
  }, [user?.businessId, authHydrated, sessionValidated]);

  const { socket, connected } = useSocket(isBusiness && authHydrated && sessionValidated);

  useRealtimeFallback(connected, () => void fetchEmployees({ quiet: true }));

  useEffect(() => {
    if (!socket || !isBusiness) return;
    const sync = () => void fetchEmployees({ quiet: true });
    socket.on("business_data_updated", sync);
    socket.on("verification_updated", sync);
    return () => {
      socket.off("business_data_updated", sync);
      socket.off("verification_updated", sync);
    };
  }, [socket, isBusiness, fetchEmployees]);

  useEffect(() => {
    void fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    if (!authHydrated || !sessionValidated || !isBusiness || !user?.businessId) return;
    let cancelled = false;
    void fetchBusinessProfile()
      .then((p) => {
        if (!cancelled) setBusinessPublicSlug(p.slug?.trim() || null);
      })
      .catch((err) => {
        logClientError("StaffManagementPage.businessSlug", err);
        if (!cancelled) setBusinessPublicSlug(null);
      });
    return () => {
      cancelled = true;
    };
  }, [authHydrated, sessionValidated, isBusiness, user?.businessId]);

  useEffect(() => {
    if (!authHydrated || !sessionValidated || !isBusiness) return;
    void (async () => {
      try {
        const [locs, tbs] = await Promise.all([fetchLocations(), fetchTables()]);
        setVenueOptions(locs);
        setTableOptions(tbs);
      } catch (err) {
        logClientError("StaffManagementPage.venues", err);
      }
    })();
  }, [authHydrated, sessionValidated, isBusiness]);

  const filteredEmployees = employees.filter(
    (emp) =>
      String(emp.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(emp.role).toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(emp.email).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tablesForAddPicker = tableOptions.filter(
    (t) => !addForm.locationId || t.locationId === addForm.locationId
  );
  const tablesForEditPicker = tableOptions.filter(
    (t) => !editForm.locationId || t.locationId === editForm.locationId
  );

  const handleGenerateInvite = async () => {
    if (!isBusiness) {
      toastErr("Only business owners can generate invite codes.");
      return;
    }
    setIsGenerating(true);
    try {
      const data = await generateInviteCode();
      setInviteCode(data.inviteCode);
      setInviteExpiresAt(data.expiresAt ?? null);
      toastOk("Invite code generated successfully.");
    } catch (err) {
      logClientError("StaffManagementPage", err);
      toastErr(toUserFriendlyMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    if (!isBusiness) return;
    await handleGenerateInvite();
  };

  const handleCopyCode = async () => {
    if (!inviteCode) return;
    try {
      await navigator.clipboard.writeText(inviteCode);
      toastOk("Copied to clipboard!");
    } catch (err) {
      logClientError("StaffManagementPage", err);
      toastErr("Unable to copy. Please try again.");
    }
  };

  const handleAddEmployeeSubmit = async () => {
    if (!isBusiness || !user?.businessId) {
      toastErr("Only business owners can add employees.");
      return;
    }
    const name = addForm.name.trim();
    const email = addForm.email.trim();
    if (!name || !email) {
      toastErr("Name and email are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await createEmployee({
        name,
        role: addForm.role,
        email,
        phone: addForm.phone.trim() || undefined,
        locationId: addForm.locationId.trim() ? addForm.locationId : null,
        tableIds: addForm.tableIds,
        useActivationFlow: true,
      });
      setShowAddModal(false);
      setAddForm({
        name: "",
        role: "Server",
        email: "",
        phone: "",
        locationId: "",
        tableIds: [],
      });
      await fetchEmployees();
      const tempMsg = created.temporaryPassword
        ? ` Their temporary password is "${created.temporaryPassword}". Share it securely so they can log in.`
        : "";
      toastOk(
        created.temporaryPassword
          ? `${created.name} has been added to your team.${tempMsg}`
          : `${created.name} has been invited. They’ll receive an email to set their password.`
      );
    } catch (err) {
      logClientError("StaffManagementPage", err);
      toastErr(toUserFriendlyMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEdit = (employee: StaffRow) => {
    setEditForm({
      id: employee.id,
      name: employee.name,
      role: employee.role,
      email: employee.email,
      monthlyGoal:
        employee.monthlyGoal != null ? String(employee.monthlyGoal) : "",
      isActive: employee.isActive,
      locationId: employee.locationId ?? "",
      tableIds: [...employee.assignedTableIds],
    });
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editForm.id) return;
    const name = editForm.name.trim();
    const email = editForm.email.trim();
    if (!name || !email) {
      toastErr("Name and email are required.");
      return;
    }
    let monthlyGoal: number | null | undefined = undefined;
    if (editForm.monthlyGoal.trim() === "") {
      monthlyGoal = null;
    } else {
      const n = parseFloat(editForm.monthlyGoal);
      if (Number.isNaN(n) || n < 0) {
        toastErr("Monthly goal must be a valid number.");
        return;
      }
      monthlyGoal = n;
    }
    setSavingEdit(true);
    try {
      await updateEmployee(editForm.id, {
        name,
        role: editForm.role,
        email,
        monthlyGoal,
        isActive: editForm.isActive,
        locationId: editForm.locationId.trim() ? editForm.locationId : null,
        tableIds: editForm.tableIds,
      });
      setShowEditModal(false);
      await fetchEmployees();
      toastOk("Staff updated successfully.");
    } catch (err) {
      logClientError("StaffManagementPage", err);
      toastErr(toUserFriendlyMessage(err));
    } finally {
      setSavingEdit(false);
    }
  };

  const openDelete = (employee: StaffRow) => {
    setDeleteTarget(employee);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteEmployee(deleteTarget.id);
      setShowDeleteModal(false);
      setDeleteTarget(null);
      await fetchEmployees();
      toastOk("Staff member removed.");
    } catch (err) {
      logClientError("StaffManagementPage", err);
      toastErr(toUserFriendlyMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleActive = async (employee: StaffRow) => {
    const next = !employee.isActive;
    try {
      // Optimistic UI flip (will be reconciled from backend response/refetch)
      setEmployees((prev) =>
        prev.map((e) => (e.id === employee.id ? { ...e, isActive: next } : e))
      );

      const updated = await updateEmployeeStatus(employee.id, next);

      // Update from backend response (source of truth)
      setEmployees((prev) =>
        prev.map((e) =>
          e.id === employee.id
            ? {
                ...e,
                isActive: updated.isActive,
              }
            : e
        )
      );

      // Final reconcile: refetch from DB-backed stats
      await fetchEmployees({ quiet: true });
      toastOk(next ? "Staff profile is now active." : "Staff profile deactivated. QR links are disabled.");
    } catch (err) {
      logClientError("StaffManagementPage", err);
      // Revert UI on failure
      setEmployees((prev) =>
        prev.map((e) => (e.id === employee.id ? { ...e, isActive: employee.isActive } : e))
      );
      toastErr(toUserFriendlyMessage(err));
    }
  };

  const handleQrDownload = async (employee: StaffRow) => {
    if (!employee.isActive) {
      toastErr("Activate this profile before downloading a QR code.");
      return;
    }
    if (!canUseQr) {
      toastErr("QR code will be available after business verification.");
      return;
    }
    try {
      const bs = businessPublicSlug?.trim();
      const es = employee.slug?.trim();
      if (bs && es) await downloadBrandedQR(bs, es, employee.name);
      else await downloadBrandedQRLegacy(employee.id, employee.name);
      toastOk("QR code downloaded.");
    } catch (err) {
      logClientError("StaffManagementPage", err);
      toastErr("Failed to download QR.");
    }
  };

  const formatExpiresAt = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (err) {
      logClientError("StaffManagementPage", err);
      return null;
    }
  };

  if (!user) return null;

  if (loading) {
    return <CareTipPageLoader message="Loading staff…" />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <p className="mb-2 text-sm font-medium text-destructive">{error}</p>
          <button onClick={() => window.location.reload()} className="text-primary hover:underline text-sm">
            Try again
          </button>
        </div>
      </div>
    );
  }

  const activeCount = employees.filter(isFullyOnboardedDashboardStaff).length;
  const tipsMonthTotal = employees.reduce((s, e) => s + (e.tips ?? 0), 0);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background pb-20">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="outline" size="icon" asChild aria-label="Back to dashboard">
            <Link to="/dashboard">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">Business dashboard</span>
        </div>

        <DashboardHero
          stackHeroOnMobile
          hideImage
          badge={
            <>
              <Users className="h-3.5 w-3.5 text-foreground" />
              Team roster
            </>
          }
          title="Staff management"
          description="Invites, roles, and active staff."
          overview={
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Team</p>
                <p className="text-lg font-bold tabular-nums text-foreground">{employees.length}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Active</p>
                <p className="text-lg font-bold tabular-nums text-foreground">{activeCount}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Tips (mo)</p>
                <p className="text-lg font-bold tabular-nums text-foreground">{formatEur(tipsMonthTotal)}</p>
              </div>
            </div>
          }
          shortcuts={
            <>
              <Link
                to="/dashboard"
                className="flex items-center justify-between rounded-lg px-2 py-2 font-medium text-foreground hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  Dashboard
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/dashboard/qr-code-management"
                className="flex items-center justify-between rounded-lg px-2 py-2 font-medium text-foreground hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <QrCode className="h-4 w-4" />
                  QR management
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          }
          actions={
            <>
              <Button
                type="button"
                onClick={handleGenerateInvite}
                disabled={!isBusiness || isGenerating}
                variant="default"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4 shrink-0" />
                    Invite
                  </>
                )}
              </Button>
              <Button
                type="button"
                onClick={() => isBusiness && setShowAddModal(true)}
                disabled={!isBusiness}
                variant="outline"
              >
                <Plus className="mr-2 h-4 w-4 shrink-0" />
                Add
              </Button>
            </>
          }
        />
      </div>

      <TracingBeam className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="space-y-6 py-2">
          <Card className="rounded-xl bg-white border border-black/[0.06] shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Search</CardTitle>
              <CardDescription>Filter by name or role</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Search employees…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-black/[0.10] bg-background py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </CardContent>
          </Card>

        {/* Invite Code Card */}
        {inviteCode && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className={dashStatCard("relative overflow-hidden")}>
              <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border bg-muted">
                  <KeyRound className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <p className="mb-0.5 text-sm font-medium text-muted-foreground">Staff invite code</p>
                  <p className="select-all break-all font-mono text-xl font-bold tracking-wider text-foreground sm:text-2xl md:text-3xl sm:tracking-[0.3em]">
                    {inviteCode}
                  </p>
                  {inviteExpiresAt && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Expires {formatExpiresAt(inviteExpiresAt)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" variant="outline" onClick={handleCopyCode} className={DASH_BTN_SECONDARY}>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy
                </Button>
                <Button type="button" onClick={handleRegenerate} disabled={isGenerating} className={DASH_BTN_PRIMARY}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`} />
                  Regenerate
                </Button>
              </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Desktop Table View */}
        <div className="hidden overflow-hidden rounded-xl border border-black/[0.06] bg-white shadow-sm lg:block">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Employee</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Role</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    QR assignment
                  </span>
                </th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-foreground">Contact</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-foreground">Tips (Month)</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-foreground">Rating</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-foreground">Active</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12">
                    <div className={DASH_EMPTY_STATE}>
                      <Users className={DASH_EMPTY_ICON} />
                      <p className="text-sm font-medium">No staff members yet.</p>
                      <p className="mt-1 text-sm text-gray-400">
                        Add employees to get started.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee, index) => {
                  const rosterNote = staffRosterStatusNote(employee);
                  return (
                <motion.tr
                  key={employee.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={[
                    "border-t border-border hover:bg-muted/30 transition-colors",
                    !employee.isActive ? "bg-muted/20 opacity-90" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <ProfileAvatar
                        src={employee.avatar}
                        displayName={employee.name}
                        className="h-10 w-10"
                      />
                      <div>
                        <p className="font-semibold text-foreground">{employee.name}</p>
                        <p className="text-xs text-muted-foreground">Joined {employee.joinedDate}</p>
                        {rosterNote ? (
                          <p className={rosterNoteClassName(rosterNote)}>{rosterNote}</p>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-foreground">{employee.role}</span>
                  </td>
                  <td className="px-6 py-4 max-w-[200px]">
                    <p className="text-sm text-foreground truncate">
                      {employee.locationId
                        ? venueOptions.find((l) => l.id === employee.locationId)?.name ?? "N/A"
                        : "N/A"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {employee.assignedTableIds.length > 0
                        ? `${employee.assignedTableIds.length} table(s)`
                        : "No tables"}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span>{employee.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        <span>{employee.phone || "No phone"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div>
                      <p className="font-bold text-foreground">{formatEur(Number(employee.tips))}</p>
                      <p className="text-xs text-accent">{employee.growth}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {employee.rating != null ? (
                        <>
                          <Star className="w-4 h-4 text-accent fill-accent" />
                          <span className="font-semibold text-foreground">{employee.rating}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-sm">New Member</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={employee.isActive}
                      onClick={() => handleToggleActive(employee)}
                      className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all hover:opacity-90 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                        employee.isActive ? "bg-primary" : "bg-muted"
                      }`}
                    >
                      <span
                        className="pointer-events-none inline-block h-6 w-6 translate-x-0.5 rounded-full bg-white shadow transition-transform"
                        style={{
                          transform: employee.isActive ? "translateX(1.25rem)" : "translateX(0.125rem)",
                        }}
                      />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => handleQrDownload(employee)}
                        disabled={!canUseQr || !employee.isActive}
                        className={[
                          "p-2 rounded-lg border border-transparent transition-all",
                          canUseQr && employee.isActive
                            ? "hover:bg-muted hover:border-border active:scale-95"
                            : "opacity-45 cursor-not-allowed",
                        ].join(" ")}
                        title={
                          !employee.isActive
                            ? "Activate this profile to enable QR downloads."
                            : canUseQr
                              ? "Download branded QR (app URL /qr/employee/…)"
                              : "QR code will be available after business verification."
                        }
                      >
                        <QrCode className="w-4 h-4 text-foreground" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(employee)}
                        className="p-2 rounded-lg border border-transparent hover:bg-muted hover:border-border active:scale-95 transition-all"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4 text-foreground" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openDelete(employee)}
                        className="p-2 rounded-lg border border-transparent hover:bg-red-500/10 hover:border-red-500/30 active:scale-95 transition-all"
                        title="Remove staff member"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4">
          {filteredEmployees.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No staff members yet.</div>
          ) : (
            filteredEmployees.map((employee, index) => {
              const rosterNote = staffRosterStatusNote(employee);
              return (
            <motion.div
              key={employee.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={[
                "bg-card rounded-xl border border-border p-4",
                !employee.isActive ? "border-dashed bg-muted/25 opacity-95" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="flex items-start justify-between mb-4 gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <ProfileAvatar
                    src={employee.avatar}
                    displayName={employee.name}
                    className="h-12 w-12 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{employee.name}</h3>
                    <p className="text-sm text-muted-foreground">{employee.role}</p>
                    {rosterNote ? (
                      <p className={rosterNoteClassName(rosterNote)}>{rosterNote}</p>
                    ) : null}
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {employee.locationId
                        ? venueOptions.find((l) => l.id === employee.locationId)?.name ?? "N/A"
                        : "No venue"}{" "}
                      ·{" "}
                      {employee.assignedTableIds.length > 0
                        ? `${employee.assignedTableIds.length} table(s)`
                        : "no tables"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">Active</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={employee.isActive}
                    onClick={() => handleToggleActive(employee)}
                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all hover:opacity-90 active:scale-95 ${
                      employee.isActive ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className="pointer-events-none inline-block h-6 w-6 translate-x-0.5 rounded-full bg-white shadow transition-transform"
                      style={{
                        transform: employee.isActive ? "translateX(1.25rem)" : "translateX(0.125rem)",
                      }}
                    />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Tips (Month)</p>
                  <p className="text-lg font-bold text-foreground">{formatEur(Number(employee.tips))}</p>
                  <p className="text-xs text-accent">{employee.growth}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Rating</p>
                  <div className="flex items-center gap-1">
                    {employee.rating != null ? (
                      <>
                        <Star className="w-4 h-4 text-accent fill-accent" />
                        <span className="text-lg font-bold text-foreground">{employee.rating}</span>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">New Member</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQrDownload(employee)}
                  disabled={!canUseQr || !employee.isActive}
                  className={[
                    "flex items-center justify-center gap-2 rounded-lg border-2 border-border px-4 py-2 text-sm font-medium transition-all",
                    canUseQr && employee.isActive
                      ? "bg-primary/10 text-foreground hover:bg-primary/20 active:scale-[0.98]"
                      : "bg-muted/40 text-muted-foreground cursor-not-allowed opacity-60",
                  ].join(" ")}
                  title={
                    !employee.isActive
                      ? "Activate this profile to enable QR downloads."
                      : canUseQr
                        ? "Download branded QR"
                        : "QR code will be available after business verification."
                  }
                >
                  <QrCode className="h-4 w-4" />
                  QR
                </button>
                <button
                  type="button"
                  onClick={() => openEdit(employee)}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted active:scale-[0.98] transition-all text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => openDelete(employee)}
                  className="col-span-2 flex items-center justify-center gap-2 rounded-lg border-2 border-destructive px-4 py-2 text-sm font-medium text-destructive transition-all hover:bg-destructive/10 active:scale-[0.98]"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove staff
                </button>
              </div>
            </motion.div>
              );
            })
          )}
        </div>
      </div>
      </TracingBeam>

      {/* Add Employee Modal — scrollable body, actions pinned to bottom */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex h-[min(90vh,44rem)] min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
          >
            <div className="shrink-0 border-b border-border px-5 pt-5 pb-3">
              <h2 className="text-xl font-bold text-foreground">Add New Employee</h2>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddEmployeeSubmit();
              }}
              className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
            >
              <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 [scrollbar-gutter:stable]">
                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                      <label className="mb-1 block text-sm text-muted-foreground">Full Name</label>
                      <input
                        type="text"
                        placeholder="Schmidt Paul"
                        value={addForm.name}
                        onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="mb-1 block text-sm text-muted-foreground">Role</label>
                      <select
                        value={addForm.role}
                        onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option>Server</option>
                        <option>Bartender</option>
                        <option>Chef</option>
                        <option>Host</option>
                        <option>Manager</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="min-w-0 sm:col-span-1">
                      <label className="mb-1 block text-sm text-muted-foreground">Email (required)</label>
                      <input
                        type="email"
                        placeholder="john.doe@example.com"
                        value={addForm.email}
                        onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    <div className="min-w-0 sm:col-span-1">
                      <label className="mb-1 block text-sm text-muted-foreground">Phone (optional)</label>
                      <input
                        type="tel"
                        placeholder="+1 (555) 000-0000"
                        value={addForm.phone}
                        onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We’ll use email for their account. Invite codes can be shared from this page after they’re added.
                  </p>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Assigned location (optional)</label>
                    <select
                      value={addForm.locationId}
                      onChange={(e) => {
                        const next = e.target.value;
                        setAddForm((f) => ({
                          ...f,
                          locationId: next,
                          tableIds: f.tableIds.filter((tid) => {
                            const row = tableOptions.find((x) => x.id === tid);
                            return !next || (row && row.locationId === next);
                          }),
                        }));
                      }}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Not set</option>
                      {venueOptions.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Shown on venue QR when set. Create venues under Locations.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Assigned tables (optional)</label>
                    <div className="max-h-32 overflow-y-auto rounded-lg border border-border bg-background p-2">
                      {tablesForAddPicker.length === 0 ? (
                        <p className="px-1 py-2 text-xs text-muted-foreground">
                          No tables for this filter. Add tables under Locations.
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {tablesForAddPicker.map((t) => (
                            <label
                              key={t.id}
                              className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted/50"
                            >
                              <input
                                id={`table-checkbox-${t.id}`}
                                name={`table-${t.id}`}
                                type="checkbox"
                                className="h-4 w-4 shrink-0 rounded border-border accent-primary"
                                checked={addForm.tableIds.includes(t.id)}
                                onChange={(e) => {
                                  setAddForm((f) => ({
                                    ...f,
                                    tableIds: e.target.checked
                                      ? [...f.tableIds, t.id]
                                      : f.tableIds.filter((id) => id !== t.id),
                                  }));
                                }}
                              />
                              <span className="min-w-0 truncate">{t.name}</span>
                              <span className="shrink-0 text-xs text-muted-foreground">({t.location.name})</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="shrink-0 border-t border-border bg-card px-5 py-4">
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "Adding…" : "Add employee"}
                  </Button>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit employee — scrollable body, actions pinned */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex h-[min(90vh,44rem)] min-h-0 w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_10px_30px_rgba(0,0,0,0.06)]"
          >
            <div className="shrink-0 border-b border-border px-5 pt-5 pb-3">
              <h2 className="text-xl font-bold text-foreground">Edit staff member</h2>
            </div>
            <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 [scrollbar-gutter:stable]">
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Full name</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Role</label>
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm((f) => ({ ...f, role: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option>Server</option>
                      <option>Bartender</option>
                      <option>Chef</option>
                      <option>Host</option>
                      <option>Manager</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="min-w-0">
                    <label className="mb-1 block text-sm text-muted-foreground">Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Monthly goal ($)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Leave empty for no goal"
                      value={editForm.monthlyGoal}
                      onChange={(e) => setEditForm((f) => ({ ...f, monthlyGoal: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Assigned location (optional)</label>
                  <select
                    value={editForm.locationId}
                    onChange={(e) => {
                      const next = e.target.value;
                      setEditForm((f) => ({
                        ...f,
                        locationId: next,
                        tableIds: f.tableIds.filter((tid) => {
                          const row = tableOptions.find((x) => x.id === tid);
                          return !next || (row && row.locationId === next);
                        }),
                      }));
                    }}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Not set</option>
                    {venueOptions.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Assigned tables (optional)</label>
                  <div className="max-h-32 overflow-y-auto rounded-lg border border-border bg-background p-2">
                    {tablesForEditPicker.length === 0 ? (
                      <p className="px-1 py-2 text-xs text-muted-foreground">
                        No tables for this filter. Add tables under Locations.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {tablesForEditPicker.map((t) => (
                          <label
                            key={t.id}
                            className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-muted/50"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 shrink-0 rounded border-border accent-primary"
                              checked={editForm.tableIds.includes(t.id)}
                              onChange={(e) => {
                                setEditForm((f) => ({
                                  ...f,
                                  tableIds: e.target.checked
                                    ? [...f.tableIds, t.id]
                                    : f.tableIds.filter((id) => id !== t.id),
                                }));
                              }}
                            />
                            <span className="min-w-0 truncate">{t.name}</span>
                            <span className="shrink-0 text-xs text-muted-foreground">({t.location.name})</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-3 pt-1">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="h-4 w-4 rounded border-border accent-primary"
                  />
                  <span className="text-sm text-foreground">Active (QR and tipping enabled)</span>
                </label>
              </div>
            </div>
            <div className="shrink-0 border-t border-border bg-card px-5 py-4">
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="button" disabled={savingEdit} onClick={handleEditSave} className="flex-1">
                  {savingEdit ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteModal && deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-xl border border-border p-6 max-w-md w-full"
          >
            <h2 className="text-xl font-bold text-foreground mb-2">Remove staff member?</h2>
            <p className="text-sm text-muted-foreground mb-6">
              This will permanently delete {deleteTarget.name}&apos;s account and tip history associations
              (right to erasure). This cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteTarget(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                disabled={deleting}
                onClick={handleDeleteConfirm}
              >
                {deleting ? "Removing…" : "Delete"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
