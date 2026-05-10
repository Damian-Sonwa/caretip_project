import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Building2, CheckCircle, Search, Shield, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router";
import {
  fetchPlatformBusinesses,
  updatePlatformBusinessVerificationStatus,
  updatePlatformBusinessKyc,
  uploadPlatformBusinessLogo,
  uploadPlatformBusinessVerification,
  fetchAuthedObjectUrl,
  type PlatformBusinessRow,
  type PlatformVerificationAction,
} from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { formatEur } from "../../lib/formatEur";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { useRealtimeFallback } from "../../hooks/useRealtimeFallback";

export function BusinessVerificationPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [rows, setRows] = useState<PlatformBusinessRow[]>([]);
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchPlatformBusinesses();
      setRows(res.businesses);
    } catch (e) {
      logClientError("BusinessVerificationPage.load", e);
      toast.error(toUserFriendlyMessage(e));
      setRows([]);
    } finally {
      setLoading(false);
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
    try {
      await updatePlatformBusinessVerificationStatus(businessId, status);
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

  return (
    <main className="px-4 lg:px-8 py-8 pb-20">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2 flex items-center gap-2">
                <Shield className="w-7 h-7 text-accent" />
                {t("admin.businessVerificationPage.title")}
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                {t("admin.businessVerificationPage.subtitle")}
              </p>
            </div>

            <div className="relative mb-4 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("admin.businessVerificationPage.searchPlaceholder")}
                autoComplete="off"
                aria-label={t("admin.businessVerificationPage.searchAria")}
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
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t("admin.businessVerificationPage.colBusiness")}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t("admin.businessVerificationPage.colOwner")}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t("admin.businessVerificationPage.colContact")}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t("admin.businessVerificationPage.colLiveTips")}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t("admin.businessVerificationPage.colStatus")}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">{t("admin.businessVerificationPage.colFiles")}</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground text-right">{t("admin.businessVerificationPage.colActions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-10">
                          <CareTipPageLoader variant="compact" message={t("admin.businessVerificationPage.loading")} />
                        </td>
                      </tr>
                    ) : filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                          {rows.length === 0
                            ? t("admin.businessVerificationPage.emptyList")
                            : t("admin.businessVerificationPage.noSearchMatches")}
                        </td>
                      </tr>
                    ) : (
                      filteredRows.map((b) => (
                        <tr key={b.id} className="border-b border-border/60 hover:bg-muted/30">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                              <div>
                                <div className="font-medium">{b.name}</div>
                                <div className="text-xs text-muted-foreground font-mono">{b.slug}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs">{b.ownerEmail}</td>
                          <td className="px-4 py-3 text-xs max-w-[160px]">
                            <div>{b.contactEmail ?? t("format.notAvailable")}</div>
                            <div className="text-muted-foreground">{b.contactPhone ?? ""}</div>
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap">
                            <div className="font-medium">{formatEur(b.totalTipsEur ?? 0)}</div>
                            <div className="text-muted-foreground">
                              {t("admin.businessVerificationPage.tipsStaffSummary", {
                                tips: b.successTipCount ?? 0,
                                staff: b.staffCount ?? 0,
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {b.verificationStatus === "verified" ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-success px-2 py-0.5 text-xs font-medium text-success-foreground">
                                <CheckCircle className="w-3.5 h-3.5" /> {t("admin.businessVerificationPage.statusVerified")}
                              </span>
                            ) : b.verificationStatus === "rejected" ? (
                              <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-xs font-medium">
                                <XCircle className="w-3.5 h-3.5" /> {t("admin.businessVerificationPage.statusRejected")}
                              </span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">
                                {t("admin.businessVerificationPage.statusPending")}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs space-y-1">
                            {b.logoPath ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  const path = b.logoPath;
                                  if (!path) return;
                                  try {
                                    const objUrl = await fetchAuthedObjectUrl(path);
                                    window.open(objUrl, "_blank", "noopener,noreferrer");
                                  } catch (err) {
                                    toast.error(toUserFriendlyMessage(err));
                                  }
                                }}
                                className="text-accent hover:underline block text-left"
                              >
                                {t("admin.businessVerificationPage.fileLogo")}
                              </button>
                            ) : (
                              <span className="text-muted-foreground">{t("admin.businessVerificationPage.filesNone")}</span>
                            )}
                            {b.verificationDocumentPath ? (
                              <button
                                type="button"
                                onClick={async () => {
                                  const path = b.verificationDocumentPath;
                                  if (!path) return;
                                  try {
                                    const objUrl = await fetchAuthedObjectUrl(path);
                                    window.open(objUrl, "_blank", "noopener,noreferrer");
                                  } catch (err) {
                                    toast.error(toUserFriendlyMessage(err));
                                  }
                                }}
                                className="text-accent hover:underline block text-left"
                              >
                                {t("admin.businessVerificationPage.fileKycDoc")}
                              </button>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-right">
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
                              {b.verificationStatus !== "verified" && (
                                <button
                                  type="button"
                                  onClick={() => void handleStatusUpdate(b.id, "verified")}
                                  className="text-xs font-medium px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary-hover"
                                >
                                  {t("admin.businessVerificationPage.btnApprove")}
                                </button>
                              )}
                              {b.verificationStatus === "pending" && (
                                <button
                                  type="button"
                                  onClick={() => void handleStatusUpdate(b.id, "rejected")}
                                  className="text-xs font-medium px-2 py-1 rounded border border-destructive text-destructive hover:bg-destructive/10"
                                >
                                  {t("admin.businessVerificationPage.btnReject")}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {editing && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <motion.div
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-card border border-border rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                >
                  <h2 className="text-lg font-semibold mb-1">
                    {t("admin.businessVerificationPage.modalTitle", { name: editing.name })}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">{t("admin.businessVerificationPage.sectionContactInfo")}</p>
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
                      <span className="text-muted-foreground">Contact email</span>
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
                      <span className="text-muted-foreground">Registered address</span>
                      <textarea
                        className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[80px]"
                        value={form.registeredAddress}
                        onChange={(e) => setForm((f) => ({ ...f, registeredAddress: e.target.value }))}
                      />
                    </label>
                  </div>
                  <div className="mt-6 pt-4 border-t border-border space-y-3">
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
                      <span className="text-muted-foreground">Verification document (PDF or image)</span>
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,application/pdf"
                        className="mt-1 block w-full text-sm text-muted-foreground file:mr-2 file:rounded file:border-0 file:bg-muted file:px-3 file:py-1"
                        onChange={(e) => void handleVerificationUpload(e)}
                      />
                    </label>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      onClick={() => setEditing(null)}
                      className="px-4 py-2 rounded-lg border border-border text-sm"
                    >
                      {t("admin.businessVerificationPage.cancel")}
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveKyc()}
                      className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover"
                    >
                      {t("admin.businessVerificationPage.save")}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
    </main>
  );
}
