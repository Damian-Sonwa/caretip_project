import { motion } from "motion/react";
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import {
  ChevronLeft,
  QrCode,
  Download,
  Copy,
  Check,
  Users,
  MapPin,
  Printer,
  Store,
  UserCheck,
  RefreshCw,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import {
  getEmployees,
  fetchBusinessProfile,
  regenerateBusinessSlug,
  regenerateEmployeeSlug,
  fetchLocations,
  fetchTables,
  type EmployeeItem,
  type LocationDTO,
  type TableDTO,
} from "../../lib/api";
import { LoadingSpinner } from "../../components/ui/loading-spinner";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { PageLoader } from "../../components/PageLoader";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import {
  renderBrandedQRToDataUrl,
  renderBrandedQRToDataUrlLegacy,
  renderBrandedQrUrlToDataUrl,
  downloadQrDataUrlPng,
  printQrDataUrl,
} from "../../lib/qrBranded";
import {
  createBusinessQrPrintPdf,
  createEmployeeQrPrintPdf,
  downloadBusinessQrPrintPdf,
  downloadEmployeeQrPrintPdf,
} from "../../lib/qrPrintPdf";
import {
  businessDirectoryUrl,
  publicEmployeeTipUrl,
  qrBusinessUrl,
  qrEmployeeLegacyUrl,
  qrLandingUrl,
  qrLocationUrl,
  qrTableUrl,
} from "../../lib/appPublicUrl";
import { downloadStaffQrPdf } from "../../lib/qrBulkPdf";
import { resolveMediaUrl } from "../../lib/mediaUrl";
import { fetchImageUrlAsSquarePngDataUrl } from "../../lib/imageDataUrl";
import { logClientError } from "../../lib/clientLog";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dashStatCard, DASH_BTN_PRIMARY, DASH_BTN_SECONDARY } from "@/components/ui/dashboard-styles";

const TOAST_OK = { style: { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } } as const;

export function QRCodeManagementPage() {
  const { t } = useTranslation();
  const { user, authHydrated, sessionValidated, isBusiness, updateUser } = useRequireAuth();
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "verified" | "rejected" | null
  >(null);
  const [activeTab, setActiveTab] = useState<"employees" | "tables" | "locations">("employees");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [storefrontQr, setStorefrontQr] = useState<string>("");
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [bulkPdfLoading, setBulkPdfLoading] = useState(false);
  const [businessSlug, setBusinessSlug] = useState<string | null>(null);
  const [businessDisplayName, setBusinessDisplayName] = useState<string | null>(null);
  const [businessLocation, setBusinessLocation] = useState<string | null>(null);
  const [venueLocations, setVenueLocations] = useState<LocationDTO[]>([]);
  const [venueTables, setVenueTables] = useState<TableDTO[]>([]);
  const [venueQrPreview, setVenueQrPreview] = useState<Record<string, string>>({});
  /** Stored API path for venue logo (PDF + print). */
  const [businessLogoPath, setBusinessLogoPath] = useState<string | null>(null);

  useEffect(() => {
    if (!authHydrated || !sessionValidated) return;
    if (!user?.businessId || user.role !== "business") return;
    let cancelled = false;
    void fetchBusinessProfile()
      .then((p) => {
        if (cancelled) return;
        setBusinessSlug(p.slug?.trim() || null);
        setBusinessDisplayName(String(p.name ?? "").trim() || null);
        setBusinessLocation(String(p.registeredAddress ?? p.location ?? "").trim() || null);
        setBusinessLogoPath(p.logo?.trim() ? p.logo : null);
        const v = p.verificationStatus ?? "pending";
        setVerificationStatus(v);
        updateUser({
          status:
            v === "verified" ? "APPROVED" : v === "rejected" ? "REJECTED" : "PENDING",
        });
      })
      .catch((err) => {
        logClientError("QRCodeManagementPage", err);
        if (cancelled) return;
        setBusinessSlug(null);
        setBusinessDisplayName(user?.businessName ?? null);
        setBusinessLocation(null);
        setBusinessLogoPath(null);
        if (user.status === "APPROVED") setVerificationStatus("verified");
        else if (user.status === "REJECTED") setVerificationStatus("rejected");
        else setVerificationStatus("pending");
      });
    return () => {
      cancelled = true;
    };
  }, [authHydrated, sessionValidated, user?.businessId, user?.role, user?.status, updateUser]);

  const handleRegenerateBusinessQr = async () => {
    if (!authHydrated || !sessionValidated) return;
    if (qrLocked) return;
    if (!user?.businessId) return;
    setRegeneratingId("storefront");
    try {
      const r = await regenerateBusinessSlug();
      setBusinessSlug(r.slug);
      toast.success(t("business.qrPage.toastBusinessRegenerated"), TOAST_OK);
    } catch (err) {
      logClientError("QRCodeManagementPage.regenerateBusinessQr", err);
      toast.error(t("business.qrPage.toastBusinessRegenerateFail"));
    } finally {
      setRegeneratingId(null);
    }
  };

  const loadEmployees = useCallback(async () => {
    if (!authHydrated || !sessionValidated) return;
    if (!user?.businessId) {
      setEmployees([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getEmployees(user.businessId);
      setEmployees(list);
    } catch (err) {
      logClientError("QRCodeManagementPage", err);
      setEmployees([]);
      toast.error(t("business.qrPage.toastStaffListFail"));
    } finally {
      setLoading(false);
    }
  }, [authHydrated, sessionValidated, user?.businessId, t]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    if (!authHydrated || !sessionValidated) return;
    if (!user?.businessId || !isBusiness) return;
    let cancelled = false;
    void (async () => {
      try {
        const [locList, tblList] = await Promise.all([fetchLocations(), fetchTables()]);
        if (!cancelled) {
          setVenueLocations(locList);
          setVenueTables(tblList);
        }
      } catch (err) {
        logClientError("QRCodeManagementPage.venues", err);
        if (!cancelled) {
          setVenueLocations([]);
          setVenueTables([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authHydrated, sessionValidated, user?.businessId, isBusiness]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined") return;
      const next: Record<string, string> = {};
      for (const loc of venueLocations) {
        const url = qrLocationUrl(loc.id);
        try {
          next[`loc-${loc.id}`] = await renderBrandedQrUrlToDataUrl(url);
        } catch (err) {
          logClientError("QRCodeManagementPage", err);
          next[`loc-${loc.id}`] = "";
        }
      }
      for (const t of venueTables) {
        const url = qrTableUrl(t.id);
        try {
          next[`tbl-${t.id}`] = await renderBrandedQrUrlToDataUrl(url);
        } catch (err) {
          logClientError("QRCodeManagementPage", err);
          next[`tbl-${t.id}`] = "";
        }
      }
      if (!cancelled) setVenueQrPreview(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [venueLocations, venueTables]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.businessId) return;

      const storeUrl = businessSlug
        ? businessDirectoryUrl(businessSlug)
        : qrLandingUrl(user.businessId);
      try {
        const sf = await renderBrandedQrUrlToDataUrl(storeUrl);
        if (!cancelled) setStorefrontQr(sf);
      } catch (err) {
        logClientError("QRCodeManagementPage", err);
        if (!cancelled) setStorefrontQr("");
      }

      const next: Record<string, string> = {};
      for (const e of employees) {
        if (!e.slug) {
          next[e.id] = "";
          continue;
        }
        try {
          next[e.id] = businessSlug
            ? await renderBrandedQRToDataUrl(businessSlug, e.slug)
            : await renderBrandedQRToDataUrlLegacy(e.id);
        } catch (err) {
          logClientError("QRCodeManagementPage", err);
          next[e.id] = "";
        }
      }
      if (!cancelled) setQrImages(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [employees, user?.businessId, businessSlug]);

  const tables: Array<{ id: string; name: string; location: string; qrUrl: string; scans: number }> =
    venueTables.map((t) => ({
      id: t.id,
      name: t.name,
      location: t.location?.name ?? "N/A",
      qrUrl: qrTableUrl(t.id),
      scans: 0,
    }));
  const locations: Array<{ id: string; name: string; address: string; qrUrl: string; scans: number }> =
    venueLocations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      address: loc.description?.trim() || "N/A",
      qrUrl: qrLocationUrl(loc.id),
      scans: 0,
    }));

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  type CardItem = {
    id: string;
    name: string;
    role?: string;
    avatar?: string | null;
    qrUrl: string;
    scans: number;
    slug?: string | null;
    employeeRow?: EmployeeItem;
    location?: string;
    address?: string;
  };

  const handleGenerateNew = async (employee: EmployeeItem) => {
    if (!authHydrated || !sessionValidated) return;
    if (!isBusiness) return;
    setRegeneratingId(employee.id);
    try {
      const updated = await regenerateEmployeeSlug(employee.id);
      setEmployees((prev) =>
        prev.map((p) =>
          p.id === updated.id
            ? { ...p, slug: updated.slug, name: updated.name, role: updated.jobTitle }
            : p
        )
      );
      if (updated.slug) {
        const dataUrl = businessSlug
          ? await renderBrandedQRToDataUrl(businessSlug, updated.slug)
          : await renderBrandedQRToDataUrlLegacy(updated.id);
        setQrImages((prev) => ({ ...prev, [employee.id]: dataUrl }));
      }
      toast.success(t("business.qrPage.toastQrReady"), TOAST_OK);
    } catch (err) {
      logClientError("QRCodeManagementPage", err);
      toast.error(t("business.qrPage.toastQrGenerateFail"));
    } finally {
      setRegeneratingId(null);
    }
  };

  const loadLogoPngForPdf = async (): Promise<string | null> => {
    const u = resolveMediaUrl(businessLogoPath ?? undefined);
    if (!u) return null;
    return fetchImageUrlAsSquarePngDataUrl(u);
  };

  const buildVenueQrDataUrl = async (
    item: CardItem,
    previewDataUrl: string | undefined
  ): Promise<string | null> => {
    if (previewDataUrl) return previewDataUrl;
    if (!item.qrUrl) return null;
    try {
      return await renderBrandedQrUrlToDataUrl(item.qrUrl);
    } catch (err) {
      logClientError("QRCodeManagementPage.buildVenueQr", err);
      return null;
    }
  };

  const handleVenueQrDownload = async (
    item: CardItem,
    type: "storefront" | "table" | "location",
    previewDataUrl?: string
  ) => {
    const dataUrl = await buildVenueQrDataUrl(item, previewDataUrl);
    if (!dataUrl) {
      toast.error(t("business.qrPage.toastQrNotReady"));
      return;
    }
    const safe = item.name.replace(/\s+/g, "-").toLowerCase();
    const prefix =
      type === "storefront"
        ? `caretip-${safe || "business"}`
        : type === "table"
          ? `caretip-table-${safe}-${item.id.slice(0, 8)}`
          : `caretip-location-${safe}-${item.id.slice(0, 8)}`;
    downloadQrDataUrlPng(dataUrl, `${prefix}.png`);
    toast.success(t("business.qrPage.toastQrDownloaded"), TOAST_OK);
  };

  const handleVenueQrPrint = async (
    item: CardItem,
    type: "storefront" | "table" | "location",
    previewDataUrl?: string
  ) => {
    const dataUrl = await buildVenueQrDataUrl(item, previewDataUrl);
    if (!dataUrl) {
      toast.error(t("business.qrPage.toastQrNotReady"));
      return;
    }
    try {
      const displayBusinessName =
        String(businessDisplayName ?? "").trim() ||
        (type === "storefront" ? String(item.name ?? "").trim() : "") ||
        String(user?.businessName ?? "").trim() ||
        t("business.qrPage.fallbackBusinessName");
      const subtext =
        type === "storefront"
          ? String(businessLocation ?? "").trim() || null
          : type === "table" || type === "location"
            ? String(item.name ?? "").trim() || null
            : null;
      const logoPng = await loadLogoPngForPdf();
      const pdf = createBusinessQrPrintPdf({
        qrPngDataUrl: dataUrl,
        businessName: displayBusinessName,
        subtext,
        instruction: t("business.qrPage.pdfInstruction"),
        businessLogoPngDataUrl: logoPng,
      });
      const blob = pdf.output("blob") as Blob;
      const url = URL.createObjectURL(blob);
      const w = window.open(url);
      if (!w) {
        URL.revokeObjectURL(url);
        toast.error(t("business.qrPage.toastPopupsPdf"));
        return;
      }
      const timer = window.setInterval(() => {
        try {
          if (w.document?.readyState === "complete") {
            window.clearInterval(timer);
            w.focus();
            w.print();
            window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
          }
        } catch {
          window.clearInterval(timer);
          window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
        }
      }, 300);
    } catch (err) {
      logClientError("QRCodeManagementPage.print", err);
      toast.error(t("business.qrPage.toastPrintFail"));
    }
  };

  const handleGenerateAllPdf = async () => {
    if (!authHydrated || !sessionValidated) return;
    const bs = businessSlug?.trim();
    const staff = bs
      ? employees
          .filter((e) => e.slug?.trim())
          .map((e) => ({ id: e.id, name: e.name, businessSlug: bs, employeeSlug: e.slug!.trim() }))
      : [];
    if (staff.length === 0) {
      toast.error(bs ? t("business.qrPage.toastBulkNeedLinks") : t("business.qrPage.toastBulkAddStaff"));
      return;
    }
    setBulkPdfLoading(true);
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      const logoPng = await loadLogoPngForPdf();
      await downloadStaffQrPdf(staff, `CareTip_QR_All_${dateStr}`, { businessLogoPngDataUrl: logoPng });
      toast.success(t("business.qrPage.toastPdfReady"), TOAST_OK);
    } catch (err) {
      logClientError("QRCodeManagementPage", err);
      toast.error(t("business.qrPage.toastPdfFail"));
    } finally {
      setBulkPdfLoading(false);
    }
  };

  const handleVenuePrintPdf = async (
    item: CardItem,
    type: "storefront" | "table" | "location",
    previewDataUrl?: string
  ) => {
    const dataUrl = await buildVenueQrDataUrl(item, previewDataUrl);
    if (!dataUrl) {
      toast.error(t("business.qrPage.toastQrNotReady"));
      return;
    }
    try {
      const displayBusinessName =
        String(businessDisplayName ?? "").trim() ||
        (type === "storefront" ? String(item.name ?? "").trim() : "") ||
        String(user?.businessName ?? "").trim() ||
        t("business.qrPage.fallbackBusinessName");
      const subtext =
        type === "storefront"
          ? String(businessLocation ?? "").trim() || null
          : type === "table" || type === "location"
            ? String(item.name ?? "").trim() || null
            : null;
      const logoPng = await loadLogoPngForPdf();
      await downloadBusinessQrPrintPdf({
        qrPngDataUrl: dataUrl,
        businessName: displayBusinessName,
        subtext,
        instruction: t("business.qrPage.pdfInstruction"),
        businessLogoPngDataUrl: logoPng,
        fileBaseName:
          type === "storefront"
            ? `CareTip_QR_${displayBusinessName}`
            : type === "table"
              ? `CareTip_QR_Table_${displayBusinessName}_${item.name}`
              : `CareTip_QR_Location_${displayBusinessName}_${item.name}`,
      });
    } catch (err) {
      logClientError("QRCodeManagementPage.printPdf", err);
      toast.error(t("business.qrPage.toastPdfFail"));
    }
  };

  const handleEmployeePrintPdf = async (item: CardItem) => {
    const dataUrl = qrImages[item.id];
    if (!dataUrl) {
      toast.error(t("business.qrPage.toastQrNotReady"));
      return;
    }
    try {
      const displayBusinessName =
        String(businessDisplayName ?? "").trim() || String(user?.businessName ?? "").trim() || t("business.qrPage.fallbackBusinessName");
      const logoPng = await loadLogoPngForPdf();
      await downloadEmployeeQrPrintPdf({
        qrPngDataUrl: dataUrl,
        employeeName: item.name,
        businessName: displayBusinessName,
        businessLogoPngDataUrl: logoPng,
        fileBaseName: `CareTip_QR_${item.name}`,
      });
    } catch (err) {
      logClientError("QRCodeManagementPage.employeePrintPdf", err);
      toast.error(t("business.qrPage.toastPdfFail"));
    }
  };

  const handleEmployeePrint = async (item: CardItem, previewDataUrl?: string) => {
    const dataUrl = previewDataUrl || qrImages[item.id];
    if (!dataUrl) {
      toast.error(t("business.qrPage.toastQrNotReady"));
      return;
    }
    try {
      const displayBusinessName =
        String(businessDisplayName ?? "").trim() || String(user?.businessName ?? "").trim() || t("business.qrPage.fallbackBusinessName");
      const logoPng = await loadLogoPngForPdf();
      const pdf = createEmployeeQrPrintPdf({
        qrPngDataUrl: dataUrl,
        employeeName: item.name,
        businessName: displayBusinessName,
        businessLogoPngDataUrl: logoPng,
      });
      const blob = pdf.output("blob") as Blob;
      const url = URL.createObjectURL(blob);
      const w = window.open(url);
      if (!w) {
        URL.revokeObjectURL(url);
        toast.error(t("business.qrPage.toastPopupsPdf"));
        return;
      }
      const timer = window.setInterval(() => {
        try {
          if (w.document?.readyState === "complete") {
            window.clearInterval(timer);
            w.focus();
            w.print();
            window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
          }
        } catch {
          window.clearInterval(timer);
          window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
        }
      }, 300);
    } catch (err) {
      logClientError("QRCodeManagementPage.employeePrint", err);
      toast.error(t("business.qrPage.toastPrintFail"));
    }
  };

  const QRCard = ({
    item,
    type,
    previewDataUrl,
  }: {
    item: CardItem;
    type: string;
    previewDataUrl?: string;
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={dashStatCard("text-foreground")}
    >
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex-shrink-0">
          <div className="flex h-44 w-44 shrink-0 items-center justify-center rounded-lg border border-black/[0.10] bg-white p-1.5">
            {previewDataUrl ? (
              <img src={previewDataUrl} alt="" className="h-full w-full object-contain" />
            ) : (
              <QrCode className="h-20 w-20 text-foreground" />
            )}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div>
            {type === "storefront" && (
              <div className="mb-2">
                <h3 className="font-semibold text-foreground">{item.name}</h3>
                <p className="text-sm text-muted-foreground">{t("business.qrPage.teamQrSubtitle")}</p>
              </div>
            )}
            {type === "employee" && (
              <div className="mb-2 flex items-center gap-3">
                <ProfileAvatar src={item.avatar} displayName={item.name} className="h-10 w-10" />
                <div>
                  <h3 className="font-semibold text-foreground">{item.name}</h3>
                  <p className="text-sm text-muted-foreground">{item.role}</p>
                </div>
              </div>
            )}
            {type === "table" && (
              <div>
                <h3 className="mb-1 font-semibold text-foreground">{item.name}</h3>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {item.location}
                </p>
              </div>
            )}
            {type === "location" && (
              <div>
                <h3 className="mb-1 font-semibold text-foreground">{item.name}</h3>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {item.address}
                </p>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-black/[0.08] bg-muted/30 p-3">
            <p className="mb-1 text-xs text-muted-foreground">{t("business.qrPage.labelQrUrl")}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate font-mono text-xs text-foreground">{item.qrUrl}</code>
              <button
                type="button"
                onClick={() => handleCopy(item.id, item.qrUrl)}
                className="flex-shrink-0 rounded-lg p-2 transition-colors hover:bg-background"
                aria-label={t("business.qrPage.copyUrlAria")}
              >
                {copiedId === item.id ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Copy className="h-4 w-4 opacity-60" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-sm text-muted-foreground">
              <span>{t("business.qrPage.totalScans")} </span>
              <span className="font-semibold text-foreground">{item.scans}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {type === "employee" && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleEmployeePrint(item, previewDataUrl)}
                    disabled={qrLocked}
                    className={DASH_BTN_SECONDARY}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    {t("business.qrPage.print")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleEmployeePrintPdf(item)}
                    disabled={qrLocked || !previewDataUrl}
                    className={DASH_BTN_PRIMARY}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    {t("business.qrPage.downloadPdfLayout")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={item.slug ? "outline" : "default"}
                    onClick={() => item.employeeRow && handleGenerateNew(item.employeeRow)}
                    disabled={qrLocked || regeneratingId === item.id}
                    className={item.slug ? DASH_BTN_SECONDARY : DASH_BTN_PRIMARY}
                  >
                    {regeneratingId === item.id ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {item.slug ? "Generate new" : "Generate profile link"}
                  </Button>
                </>
              )}
              {(type === "storefront" || type === "table" || type === "location") && (
                <>
                  {type === "storefront" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={handleRegenerateBusinessQr}
                      disabled={qrLocked || regeneratingId === "storefront"}
                      className={DASH_BTN_SECONDARY}
                    >
                      {regeneratingId === "storefront" ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      {t("business.qrPage.regenerateBusinessQr")}
                    </Button>
                  ) : null}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleVenueQrPrint(item, type as "storefront" | "table" | "location", previewDataUrl)}
                    disabled={qrLocked}
                    className={DASH_BTN_SECONDARY}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    {t("business.qrPage.print")}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleVenuePrintPdf(item, type, previewDataUrl)}
                    disabled={qrLocked || !previewDataUrl}
                    className={DASH_BTN_PRIMARY}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    {t("business.qrPage.downloadPdfLayout")}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  if (!user) return null;

  const canUseQr =
    Boolean(user.impersonation) ||
    verificationStatus === "verified" ||
    user.status === "APPROVED";

  const qrLocked = !canUseQr;

  /** Only block the shell while we still expect `fetchBusinessProfile` to set KYC (managers with a business id). */
  const awaitingBusinessVerification =
    !user.impersonation &&
    user.role === "business" &&
    Boolean(user.businessId) &&
    verificationStatus === null;

  if (awaitingBusinessVerification) {
    return <PageLoader message={t("business.qrPage.checkingVerification")} />;
  }

  if (qrLocked) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6 pb-20 text-foreground">
        <div className="max-w-lg space-y-4 text-center">
          <QrCode className="mx-auto h-14 w-14 opacity-40" />
          <h1 className="text-2xl font-bold">{t("business.qrPage.pendingTitle")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("business.qrPage.pendingBody")}</p>
          <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
            <Button asChild variant="outline">
              <Link to="/dashboard">
                <ChevronLeft className="mr-2 h-4 w-4" />
                {t("business.qrPage.backDashboard")}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const statusLabel =
    verificationStatus === "verified"
      ? t("admin.verification.verified")
      : verificationStatus === "rejected"
        ? t("admin.verification.rejected")
        : t("admin.verification.pending");

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <div className="mb-4 flex items-center gap-2">
          <Button variant="outline" size="icon" asChild aria-label={t("business.qrPage.backDashboard")}>
            <Link to="/dashboard">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">{t("business.qrPage.dashboardBreadcrumb")}</span>
        </div>

        <DashboardHero
          stackHeroOnMobile
          hideTabs
          hideImage
          badge={
            <>
              <QrCode className="h-3.5 w-3.5 text-foreground" />
              {qrLocked ? t("business.qrPage.badgePending") : t("business.qrPage.badgePrintable")}
            </>
          }
          title={t("business.qrPage.heroTitle")}
          description={businessSlug ? t("business.qrPage.heroDescWithSlug") : t("business.qrPage.heroDescNoSlug")}
          actions={
            <Button
              type="button"
              onClick={handleGenerateAllPdf}
              disabled={qrLocked || bulkPdfLoading || employees.length === 0}
            >
              {bulkPdfLoading ? (
                <LoadingSpinner size="sm" className="mr-2 shrink-0" />
              ) : (
                <FileDown className="mr-2 h-4 w-4 shrink-0" />
              )}
              {t("business.qrPage.allPdfs")}
            </Button>
          }
        />

        <Card className="mt-4 w-full rounded-2xl border border-gray-100 bg-white shadow-none">
          <CardContent className="p-4 sm:p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("business.qrPage.atAGlance")}
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">{t("business.qrPage.statStaff")}</p>
                <p className="text-lg font-bold tabular-nums text-foreground">{employees.length}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">{t("business.qrPage.statStatus")}</p>
                <p className="text-lg font-bold text-foreground">{statusLabel}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">{t("business.qrPage.statSlug")}</p>
                <p className="text-lg font-bold text-foreground">
                  {businessSlug ? t("business.qrPage.slugLive") : t("business.qrPage.slugNa")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {qrLocked ? (
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm">
            <p className="font-semibold text-foreground">{t("business.qrPage.reviewBody")}</p>
            <p className="mt-1 text-muted-foreground">{t("business.qrPage.qrLockedSub")}</p>
          </div>
        </div>
      ) : null}

      <TracingBeam className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="space-y-6 py-4">
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("business.qrPage.sectionsTitle")}</CardTitle>
              <CardDescription>{t("business.qrPage.sectionsDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted/50 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab("employees")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all sm:flex-initial ${
                    activeTab === "employees" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("business.qrPage.tabEmployees")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("tables")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all sm:flex-initial ${
                    activeTab === "tables" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("business.qrPage.tabTables")}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("locations")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all sm:flex-initial ${
                    activeTab === "locations" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("business.qrPage.tabLocations")}</span>
                </button>
              </div>
            </CardContent>
          </Card>

      <div className="max-w-7xl">
        {activeTab === "employees" && (
          <>
            {loading ? (
              <CareTipPageLoader variant="section" message={t("common.loadingTeamMembers")} />
            ) : (
              <div className="space-y-8">
                {user?.businessId && (
                  <div>
                    <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                      <Store className="h-4 w-4 text-primary" />
                      {t("business.qrPage.storefrontQrHeading", {
                        name:
                          String(businessDisplayName ?? "").trim() ||
                          user?.businessName ||
                          t("business.qrPage.fallbackBusinessName"),
                      })}
                    </h2>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Place at the entrance. Customers scan to choose who to tip.
                    </p>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Same page:{" "}
                      <code className="break-all font-mono text-[11px] text-foreground/90">
                        {businessSlug ? businessDirectoryUrl(businessSlug) : qrBusinessUrl(user.businessId)}
                      </code>
                    </p>
                    <QRCard
                      item={{
                        id: "storefront",
                        name:
                          String(businessDisplayName ?? "").trim() ||
                          user?.businessName ||
                          t("business.qrPage.fallbackBusinessName"),
                        qrUrl: businessSlug
                          ? businessDirectoryUrl(businessSlug)
                          : qrLandingUrl(user.businessId),
                        scans: 0,
                      }}
                      type="storefront"
                      previewDataUrl={storefrontQr}
                    />
                  </div>
                )}

                <div>
                  <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                    <UserCheck className="h-4 w-4 text-primary" />
                    Staff tags
                  </h2>
                  <p className="mb-3 text-xs text-muted-foreground">
                    Individual QR codes for each team member — same branded style as storefront, tables, and locations.
                  </p>
                  {employees.length === 0 ? (
                    <div className="rounded-xl border-2 border-border bg-card py-12 text-center">
                      <p className="mb-2 text-muted-foreground">{t("business.qrPage.noEmployees")}</p>
                      <Link
                        to="/dashboard/staff-management"
                        className="text-sm font-semibold text-foreground underline underline-offset-2"
                      >
                        Add staff in Staff Management
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {employees.map((employee) => (
                        <QRCard
                          key={employee.id}
                          item={{
                            id: employee.id,
                            name: employee.name,
                            role: employee.role,
                            avatar: employee.avatar,
                            qrUrl:
                              businessSlug && employee.slug
                                ? publicEmployeeTipUrl(businessSlug, employee.slug)
                                : qrEmployeeLegacyUrl(employee.id),
                            scans: 0,
                            slug: employee.slug,
                            employeeRow: employee,
                          }}
                          type="employee"
                          previewDataUrl={qrImages[employee.id]}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "tables" && (
          <div className="space-y-4">
            {tables.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <p className="mb-6">{t("business.qrPage.noTables")}</p>
                <Link
                  to="/dashboard/tables"
                  className="text-sm font-semibold text-foreground underline underline-offset-2"
                >
                  Add tables
                </Link>
              </div>
            ) : (
              tables.map((table) => (
                <QRCard
                  key={table.id}
                  item={table}
                  type="table"
                  previewDataUrl={venueQrPreview[`tbl-${table.id}`]}
                />
              ))
            )}
          </div>
        )}

        {activeTab === "locations" && (
          <div className="space-y-4">
            {locations.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground">
                <p className="mb-6">{t("business.qrPage.noLocations")}</p>
                <Link
                  to="/dashboard/locations"
                  className="text-sm font-semibold text-foreground underline underline-offset-2"
                >
                  Add locations
                </Link>
              </div>
            ) : (
              locations.map((location) => (
                <QRCard
                  key={location.id}
                  item={location}
                  type="location"
                  previewDataUrl={venueQrPreview[`loc-${location.id}`]}
                />
              ))
            )}
          </div>
        )}
      </div>
        </div>
      </TracingBeam>
    </div>
  );
}
