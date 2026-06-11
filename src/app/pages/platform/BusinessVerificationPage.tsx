import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Building2, CheckCircle, Shield, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";
import {
  fetchPlatformBusinesses,
  fetchKycQueueMetrics,
  updatePlatformBusinessVerificationStatus,
  updatePlatformBusinessKyc,
  uploadPlatformBusinessLogo,
  uploadPlatformBusinessVerification,
  fetchAuthedObjectUrl,
  type KycQueueMetrics,
  type PlatformBusinessRow,
  type PlatformVerificationAction,
} from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import {
  DashboardListSkeleton,
  PlatformAdminTableSkeleton,
} from "../../components/dashboard/DashboardSectionLoading";
import { formatEur } from "../../lib/formatEur";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { useRealtimeFallback } from "../../hooks/useRealtimeFallback";
import {
  PlatformPage,
  PlatformPageHeader,
  PlatformResponsiveData,
  PlatformSearchField,
} from "../../components/platform/PlatformPageChrome";
import { PlatformBusinessVerificationMobileCard } from "../../components/platform/platformAdminMobileCards";
import { platformUi } from "../../components/platform/platformDashboardUi";
import {
  getPageSessionCache,
  setPageSessionCache,
  PAGE_CACHE_TTL_MEDIUM_MS,
} from "../../lib/pageSessionCache";

export function BusinessVerificationPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [rows, setRows] = useState<PlatformBusinessRow[]>([]);
  const [kycMetrics, setKycMetrics] = useState<KycQueueMetrics | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<PlatformBusinessRow | null>(null);
  const [form, setForm] = useState({
    legalContactName: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    registeredAddress: "",
  });

  const load = useCallback(async (opts?: { quiet?: boolean }) => {
    const quiet = opts?.quiet === true;
    const cacheKey = "platform:business-verification";
    const cached = getPageSessionCache<PlatformBusinessRow[]>(cacheKey, PAGE_CACHE_TTL_MEDIUM_MS);
    const useCachedFirst = !quiet && cached !== null;
    if (useCachedFirst) {
      setRows(cached);
      setLoading(false);
    } else if (!quiet) {
      setLoading(true);
    }
    try {
      const res = await fetchPlatformBusinesses();
      setRows(res.businesses);
      setPageSessionCache(cacheKey, res.businesses);
    } catch (e) {
      logClientError("BusinessVerificationPage.load", e);
      if (!useCachedFirst) {
        toast.error(toUserFriendlyMessage(e));
        setRows([]);
      }
    } finally {
      if (!quiet && !useCachedFirst) setLoading(false);
    }
  }, []);

  const loadQuiet = useCallback(async () => {
    try {
      const res = await fetchPlatformBusinesses();
      setRows(res.businesses);
    } catch (e) {
      logClientError("BusinessVerificationPage.loadQuiet", e);
    }
  }, []);

  const { socket, connected } = useSocket(user?.role === "platform_admin");

  useRealtimeFallback(connected, loadQuiet, 60000);

  useEffect(() => {
    if (!socket || user?.role !== "platform_admin") return;
    const s = () => void loadQuiet();
    socket.on("platform_data_updated", s);
    socket.on("platform_verification_updated", s);
    return () => {
      socket.off("platform_data_updated", s);
      socket.off("platform_verification_updated", s);
    };
  }, [socket, user?.role, loadQuiet]);

  useEffect(() => {
    void load();
    void fetchKycQueueMetrics()
      .then(setKycMetrics)
      .catch((e) => logClientError("BusinessVerificationPage.kycMetrics", e));
  }, [load]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((b) => {
      const hay = [
        b.name,
        b.slug,
        b.ownerEmail,
        b.contactEmail,
        b.contactPhone,
        b.legalContactName,
        b.registeredAddress,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [rows, searchQuery]);

  const handleStatusUpdate = async (businessId: string, status: PlatformVerificationAction) => {
    let reviewNote: string | undefined;
    if (status === "rejected") {
      reviewNote = window.prompt(t("admin.businessVerificationPage.rejectNotePrompt", "Rejection reason (optional):")) ?? undefined;
    }
    try {
      await updatePlatformBusinessVerificationStatus(businessId, status, reviewNote);
      if (status === "verified") {
        toast.success(t("admin.businessVerificationPage.toastApproved"));
      } else if (status === "rejected") {
        toast.success(t("admin.businessVerificationPage.toastRejected"));
      } else {
        toast.success(t("admin.businessVerificationPage.toastStatusUpdated"));
      }
      await load();
    } catch (e) {
      logClientError("BusinessVerificationPage.handleStatusUpdate", e);
      toast.error(toUserFriendlyMessage(e));
    }
  };

  const openEdit = (b: PlatformBusinessRow) => {
    setEditing(b);
    setForm({
      legalContactName: b.legalContactName ?? "",
      contactEmail: b.contactEmail ?? "",
      contactPhone: b.contactPhone ?? "",
      website: b.website ?? "",
      registeredAddress: b.registeredAddress ?? "",
    });
  };

  const saveKyc = async () => {
    if (!editing) return;
    try {
      const { business } = await updatePlatformBusinessKyc(editing.id, {
        legalContactName: form.legalContactName || null,
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
        website: form.website || null,
        registeredAddress: form.registeredAddress || null,
      });
      setRows((prev) => prev.map((r) => (r.id === business.id ? { ...r, ...business } : r)));
      toast.success(t("admin.businessVerificationPage.toastDetailsSaved"));
      setEditing(null);
    } catch (e) {
      logClientError("BusinessVerificationPage.saveKyc", e);
      toast.error(toUserFriendlyMessage(e));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !editing) return;
    try {
      await uploadPlatformBusinessLogo(editing.id, f);
      toast.success(t("admin.businessVerificationPage.toastLogoUploaded"));
      await load();
      e.target.value = "";
    } catch (err) {
      logClientError("BusinessVerificationPage.handleLogoUpload", err);
      toast.error(toUserFriendlyMessage(err));
    }
  };

  const handleVerificationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !editing) return;
    try {
      await uploadPlatformBusinessVerification(editing.id, f);
      toast.success(t("admin.businessVerificationPage.toastDocUploaded"));
      await load();
      e.target.value = "";
    } catch (err) {
      logClientError("BusinessVerificationPage.handleVerificationUpload", err);
      toast.error(toUserFriendlyMessage(err));
    }
  };

  const openAuthedFile = async (path: string) => {
    try {
      const objUrl = await fetchAuthedObjectUrl(path);
      window.open(objUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(toUserFriendlyMessage(err));
    }
  };

  const emptyMessage =
    rows.length === 0
      ? t("admin.businessVerificationPage.emptyList")
      : t("admin.businessVerificationPage.noSearchMatches");
  const isInitialLoad = loading && rows.length === 0;

  return (
    <PlatformPage>
      <PlatformPageHeader
        icon={Shield}
        title={t("admin.businessVerificationPage.title")}
        subtitle={t("admin.businessVerificationPage.subtitle")}
      />

      {kycMetrics ? (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-3 text-sm">
            <div className="text-muted-foreground">Pending review</div>
            <div className="text-2xl font-semibold">{kycMetrics.pendingReview}</div>
          </div>
          <div className="rounded-lg border bg-card p-3 text-sm">
            <div className="text-muted-foreground">Awaiting upload</div>
            <div className="text-2xl font-semibold">{kycMetrics.awaitingUpload}</div>
          </div>
          <div className={`rounded-lg border p-3 text-sm ${kycMetrics.slaBreached > 0 ? "border-amber-500 bg-amber-50 dark:bg-amber-950/30" : "bg-card"}`}>
            <div className="text-muted-foreground">SLA breach (&gt;{kycMetrics.slaHours}h)</div>
            <div className="text-2xl font-semibold text-amber-700 dark:text-amber-400">{kycMetrics.slaBreached}</div>
          </div>
        </div>
      ) : null}

      <PlatformSearchField
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={t("admin.businessVerificationPage.searchPlaceholder")}
        ariaLabel={t("admin.businessVerificationPage.searchAria")}
      />

      <PlatformResponsiveData
        mobile={
          isInitialLoad ? (
            <DashboardListSkeleton rows={6} minHeightClass="min-h-0" />
          ) : filteredRows.length === 0 ? (
            <p className={platformUi.emptyState}>{emptyMessage}</p>
          ) : (
            filteredRows.map((b) => (
              <PlatformBusinessVerificationMobileCard
                key={b.id}
                business={b}
                onApprove={() => void handleStatusUpdate(b.id, "verified")}
                onReject={() => void handleStatusUpdate(b.id, "rejected")}
                onEdit={() => openEdit(b)}
                onOpenFile={(path) => void openAuthedFile(path)}
              />
            ))
          )
        }
        desktop={
          <table className={platformUi.table}>
            <thead>
              <tr className={platformUi.tableHeadRow}>
                <th className={platformUi.tableTh}>{t("admin.businessVerificationPage.colBusiness")}</th>
                <th className={platformUi.tableTh}>{t("admin.businessVerificationPage.colOwner")}</th>
                <th className={platformUi.tableTh}>{t("admin.businessVerificationPage.colContact")}</th>
                <th className={platformUi.tableTh}>{t("admin.businessVerificationPage.colLiveTips")}</th>
                <th className={platformUi.tableTh}>{t("admin.businessVerificationPage.colStatus")}</th>
                <th className={platformUi.tableTh}>{t("admin.businessVerificationPage.colFiles")}</th>
                <th className={`${platformUi.tableTh} text-right`}>{t("admin.businessVerificationPage.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {isInitialLoad ? (
                <PlatformAdminTableSkeleton rows={8} cols={7} />
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={7} className={platformUi.emptyState}>
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                filteredRows.map((b) => (
                  <tr key={b.id} className={platformUi.tableRow}>
                    <td className={platformUi.tableTd}>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{b.name}</div>
                          <div className="font-mono text-xs text-muted-foreground">{b.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className={`${platformUi.tableTd} text-xs`}>{b.ownerEmail}</td>
                    <td className={`${platformUi.tableTd} max-w-[160px] text-xs`}>
                      <div>{b.contactEmail ?? t("format.notAvailable")}</div>
                      <div className="text-muted-foreground">{b.contactPhone ?? ""}</div>
                    </td>
                    <td className={`${platformUi.tableTd} whitespace-nowrap text-xs`}>
                      <div className="font-medium">{formatEur(b.totalTipsEur ?? 0)}</div>
                      <div className="text-muted-foreground">
                        {t("admin.businessVerificationPage.tipsStaffSummary", {
                          tips: b.successTipCount ?? 0,
                          staff: b.staffCount ?? 0,
                        })}
                      </div>
                    </td>
                    <td className={platformUi.tableTd}>
                      {b.verificationStatus === "verified" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-xs font-medium text-success-foreground">
                          <CheckCircle className="h-3.5 w-3.5" /> {t("admin.businessVerificationPage.statusVerified")}
                        </span>
                      ) : b.verificationStatus === "rejected" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                          <XCircle className="h-3.5 w-3.5" /> {t("admin.businessVerificationPage.statusRejected")}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-amber-600 dark:text-amber-400">
                          {t("admin.businessVerificationPage.statusPending")}
                          {b.kycSlaBreached ? (
                            <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                              SLA
                            </span>
                          ) : null}
                        </span>
                      )}
                    </td>
                    <td className={`${platformUi.tableTd} space-y-1 text-xs`}>
                      {b.logoPath ? (
                        <button
                          type="button"
                          onClick={() => void openAuthedFile(b.logoPath!)}
                          className="block text-left text-accent hover:underline"
                        >
                          {t("admin.businessVerificationPage.fileLogo")}
                        </button>
                      ) : (
                        <span className="text-muted-foreground">{t("admin.businessVerificationPage.filesNone")}</span>
                      )}
                      {b.verificationDocumentPath ? (
                        <button
                          type="button"
                          onClick={() => void openAuthedFile(b.verificationDocumentPath!)}
                          className="block text-left text-accent hover:underline"
                        >
                          {t("admin.businessVerificationPage.fileKycDoc")}
                        </button>
                      ) : null}
                      {b.kycDocuments?.registration ? (
                        <button type="button" onClick={() => void openAuthedFile(b.kycDocuments!.registration!)} className="block text-left text-accent hover:underline">
                          Registration
                        </button>
                      ) : null}
                      {b.kycDocuments?.address ? (
                        <button type="button" onClick={() => void openAuthedFile(b.kycDocuments!.address!)} className="block text-left text-accent hover:underline">
                          Address proof
                        </button>
                      ) : null}
                      {b.kycDocuments?.governmentId ? (
                        <button type="button" onClick={() => void openAuthedFile(b.kycDocuments!.governmentId!)} className="block text-left text-accent hover:underline">
                          Government ID
                        </button>
                      ) : null}
                      {(b.kycDocuments?.additional ?? []).map((path, i) => (
                        <button key={`${path}-${i}`} type="button" onClick={() => void openAuthedFile(path)} className="block text-left text-accent hover:underline">
                          Additional {i + 1}
                        </button>
                      ))}
                    </td>
                    <td className={`${platformUi.tableTd} text-right`}>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Link
                          to={`/platform-admin/businesses/${b.id}`}
                          className="text-xs text-accent hover:underline"
                        >
                          {t("admin.businessVerificationPage.linkViewDetails")}
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEdit(b)}
                          className="text-xs text-accent hover:underline"
                        >
                          {t("admin.businessVerificationPage.linkEditDetails")}
                        </button>
                        {b.verificationStatus !== "verified" ? (
                          <button
                            type="button"
                            onClick={() => void handleStatusUpdate(b.id, "verified")}
                            className="rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary-hover"
                          >
                            {t("admin.businessVerificationPage.btnApprove")}
                          </button>
                        ) : null}
                        {b.verificationStatus === "pending" ? (
                          <button
                            type="button"
                            onClick={() => void handleStatusUpdate(b.id, "rejected")}
                            className="rounded border border-destructive px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                          >
                            {t("admin.businessVerificationPage.btnReject")}
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        }
      />

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border-2 border-border bg-card p-6"
          >
            <h2 className="mb-1 text-lg font-semibold">
              {t("admin.businessVerificationPage.modalTitle", { name: editing.name })}
            </h2>
            <p className="mb-4 text-sm text-muted-foreground">{t("admin.businessVerificationPage.sectionContactInfo")}</p>
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="text-muted-foreground">{t("admin.businessVerificationPage.labelLegalName")}</span>
                <input
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={form.legalContactName}
                  onChange={(e) => setForm((f) => ({ ...f, legalContactName: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">{t("admin.businessVerificationPage.labelContactEmail")}</span>
                <input
                  type="email"
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={form.contactEmail}
                  onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">{t("admin.businessVerificationPage.labelContactPhone")}</span>
                <input
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={form.contactPhone}
                  onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">{t("admin.businessVerificationPage.labelRegisteredAddress")}</span>
                <textarea
                  className="mt-1 min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={form.registeredAddress}
                  onChange={(e) => setForm((f) => ({ ...f, registeredAddress: e.target.value }))}
                />
              </label>
            </div>
            <div className="mt-6 space-y-3 border-t border-border pt-4">
              <p className="text-sm font-medium text-foreground">{t("admin.businessVerificationPage.sectionUploads")}</p>
              <p className="text-xs text-muted-foreground">
                <code className="text-[10px]">{t("admin.businessVerificationPage.uploadsHint")}</code>
              </p>
              <label className="block text-sm">
                <span className="text-muted-foreground">{t("admin.businessVerificationPage.labelLogoUpload")}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 block w-full text-sm text-muted-foreground file:mr-2 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1"
                  onChange={(e) => void handleLogoUpload(e)}
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">{t("admin.businessVerificationPage.labelVerificationDoc")}</span>
                <input
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,application/pdf"
                  className="mt-1 block w-full text-sm text-muted-foreground file:mr-2 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1"
                  onChange={(e) => void handleVerificationUpload(e)}
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-border px-4 py-2 text-sm"
              >
                {t("admin.businessVerificationPage.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void saveKyc()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
              >
                {t("admin.businessVerificationPage.save")}
              </button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </PlatformPage>
  );
}
