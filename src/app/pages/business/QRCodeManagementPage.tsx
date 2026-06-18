import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link } from "react-router";
import {
  QrCode,
  Download,
  Users,
  MapPin,
  Store,
  UserCheck,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { canUseProductionQr } from "../../lib/businessVerificationCapabilities";
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
import {
  getPageSessionCache,
  setPageSessionCache,
  PAGE_CACHE_TTL_LOW_MS,
  PAGE_CACHE_TTL_MEDIUM_MS,
} from "../../lib/pageSessionCache";
import { DashboardListSkeleton } from "../../components/dashboard/DashboardSectionLoading";
import { BusinessSubPageShellSkeleton } from "../../components/dashboard/BusinessSubPageShellSkeleton";
import { PageLoader } from "../../components/PageLoader";
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
import { DASH_BTN_PRIMARY, DASH_BTN_SECONDARY } from "@/components/ui/dashboard-styles";
import { businessUi } from "@/app/components/business/businessDashboardUi";
import {
  QrManagementCard,
  type QrManagementCardItem,
} from "@/app/components/business/QrManagementCard";
import { cn } from "@/lib/utils";

const TOAST_OK = { style: { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } } as const;

export function QRCodeManagementPage() {
  const { t } = useTranslation();
  const { user, authHydrated, sessionValidated, isBusiness } = useRequireAuth();
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
  const employeeQrCacheKeyRef = useRef("");
  const venueQrCacheKeyRef = useRef("");

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
        setVerificationStatus(p.verificationStatus ?? "pending");
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
  }, [authHydrated, sessionValidated, user?.businessId, user?.role, user?.businessName]);

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

  const loadEmployees = useCallback(async (opts?: { quiet?: boolean }) => {
    const quiet = opts?.quiet === true;
    if (!authHydrated || !sessionValidated) return;
    if (!user?.businessId) {
      setEmployees([]);
      setLoading(false);
      return;
    }
    const cacheKey = `business:qr-employees:${user.businessId}`;
    const cached = getPageSessionCache<EmployeeItem[]>(cacheKey, PAGE_CACHE_TTL_MEDIUM_MS);
    const useCachedFirst = !quiet && cached !== null;
    if (useCachedFirst) {
      setEmployees(cached);
      setLoading(false);
    } else if (!quiet) {
      setLoading(true);
    }
    try {
      const list = await getEmployees(user.businessId);
      setEmployees(list);
      setPageSessionCache(cacheKey, list);
    } catch (err) {
      logClientError("QRCodeManagementPage", err);
      if (!useCachedFirst) {
        setEmployees([]);
        toast.error(t("business.qrPage.toastStaffListFail"));
      }
    } finally {
      if (!quiet && !useCachedFirst) setLoading(false);
    }
  }, [authHydrated, sessionValidated, user?.businessId, t]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    if (!authHydrated || !sessionValidated) return;
    if (!user?.businessId || !isBusiness) return;
    let cancelled = false;
    const venueCacheKey = `business:qr-venues:${user.businessId}`;
    const venueCached = getPageSessionCache<{ locations: LocationDTO[]; tables: TableDTO[] }>(
      venueCacheKey,
      PAGE_CACHE_TTL_LOW_MS,
    );
    if (venueCached) {
      setVenueLocations(venueCached.locations);
      setVenueTables(venueCached.tables);
    }
    void (async () => {
      try {
        const [locList, tblList] = await Promise.all([fetchLocations(), fetchTables()]);
        if (!cancelled) {
          setVenueLocations(locList);
          setVenueTables(tblList);
          setPageSessionCache(venueCacheKey, { locations: locList, tables: tblList });
        }
      } catch (err) {
        logClientError("QRCodeManagementPage.venues", err);
        if (!cancelled && !venueCached) {
          setVenueLocations([]);
          setVenueTables([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authHydrated, sessionValidated, user?.businessId, isBusiness]);

  const venueQrFingerprint = useMemo(
    () =>
      [
        ...venueLocations.map((l) => `l:${l.id}`),
        ...venueTables.map((t) => `t:${t.id}`),
      ].join("|"),
    [venueLocations, venueTables],
  );

  const employeeQrFingerprint = useMemo(
    () =>
      employees
        .map((e) => `${e.id}:${e.slug ?? ""}`)
        .sort()
        .join("|"),
    [employees],
  );

  useEffect(() => {
    if (!venueQrFingerprint) return;
    if (venueQrCacheKeyRef.current === venueQrFingerprint) return;
    let cancelled = false;
    (async () => {
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
      for (const tbl of venueTables) {
        const url = qrTableUrl(tbl.id);
        try {
          next[`tbl-${tbl.id}`] = await renderBrandedQrUrlToDataUrl(url);
        } catch (err) {
          logClientError("QRCodeManagementPage", err);
          next[`tbl-${tbl.id}`] = "";
        }
      }
      if (!cancelled) {
        venueQrCacheKeyRef.current = venueQrFingerprint;
        setVenueQrPreview(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [venueQrFingerprint, venueLocations, venueTables]);

  useEffect(() => {
    const businessId = user?.businessId;
    if (!businessId) return;
    const cacheKey = `${businessId}|${businessSlug ?? ""}|${employeeQrFingerprint}`;
    if (employeeQrCacheKeyRef.current === cacheKey) return;
    let cancelled = false;
    (async () => {
      const storeUrl = businessSlug
        ? businessDirectoryUrl(businessSlug)
        : qrLandingUrl(businessId);
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
      if (!cancelled) {
        employeeQrCacheKeyRef.current = cacheKey;
        setQrImages(next);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [employees, employeeQrFingerprint, user?.businessId, businessSlug]);

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
      const pdf = await createBusinessQrPrintPdf({
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
      const pdf = await createEmployeeQrPrintPdf({
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

  const onEmployeeRegenerateCard = (item: QrManagementCardItem) => {
    const emp = employees.find((e) => e.id === item.id);
    if (emp) void handleGenerateNew(emp);
  };

  if (!user) return <BusinessSubPageShellSkeleton />;

  const canUseQr = canUseProductionQr(
    verificationStatus ?? user.status,
    Boolean(user.impersonation),
  );

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
              <Link to="/dashboard">{t("business.qrPage.backDashboard")}</Link>
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
      <div className={businessUi.subPageTop}>
        <div className={businessUi.subPageBreadcrumb}>
          <Button variant="outline" size="sm" asChild>
            <Link to="/dashboard">{t("business.qrPage.backDashboard")}</Link>
          </Button>
        </div>

        <DashboardHero
          stackHeroOnMobile
          hideTabs
          hideImage
          className={businessUi.subPageHero}
          badgeClassName={businessUi.heroBadge}
          badge={
            <>
              <QrCode className="h-3.5 w-3.5 text-foreground" />
              {qrLocked ? t("business.qrPage.badgePending") : t("business.qrPage.badgePrintable")}
            </>
          }
          title={t("business.qrPage.heroTitle")}
          description={businessSlug ? t("business.qrPage.heroDescWithSlug") : t("business.qrPage.heroDescNoSlug")}
          actions={
            <div className="dashboard-hero-actions dashboard-hero-actions--uniform">
            <Button
              type="button"
              className={cn(businessUi.btnPrimary, businessUi.heroActionBtn)}
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
            </div>
          }
        />

        <Card className={businessUi.atAGlanceCard}>
          <CardContent className={businessUi.atAGlanceContent}>
            <p className={businessUi.atAGlanceLabel}>{t("business.qrPage.atAGlance")}</p>
            <div className="dashboard-at-a-glance__grid grid grid-cols-3 text-center">
              <div>
                <p className={businessUi.atAGlanceStatLabel}>{t("business.qrPage.statStaff")}</p>
                <p className={businessUi.atAGlanceStatValue}>{employees.length}</p>
              </div>
              <div>
                <p className={businessUi.atAGlanceStatLabel}>{t("business.qrPage.statStatus")}</p>
                <p className={businessUi.atAGlanceStatValue}>{statusLabel}</p>
              </div>
              <div>
                <p className={businessUi.atAGlanceStatLabel}>{t("business.qrPage.statSlug")}</p>
                <p className={businessUi.atAGlanceStatValue}>
                  {businessSlug ? t("business.qrPage.slugLive") : t("business.qrPage.slugNa")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {qrLocked ? (
        <div className="w-full px-4 sm:px-6">
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm">
            <p className="font-semibold text-foreground">{t("business.qrPage.reviewBody")}</p>
            <p className="mt-1 text-muted-foreground">{t("business.qrPage.qrLockedSub")}</p>
          </div>
        </div>
      ) : null}

      <TracingBeam className={cn(businessUi.subPageMain, "pb-4")}>
        <div className="space-y-6">
          <Card className={cn(businessUi.cardStatic, "w-full")}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t("business.qrPage.sectionsTitle")}</CardTitle>
              <CardDescription className={businessUi.cardDesc}>{t("business.qrPage.sectionsDesc")}</CardDescription>
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

      <div className="w-full min-w-0">
        {activeTab === "employees" && (
          <>
            {loading && employees.length === 0 ? (
              <DashboardListSkeleton rows={5} minHeightClass="min-h-[240px]" />
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
                    <QrManagementCard
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
                      copiedId={copiedId}
                      qrLocked={qrLocked}
                      regeneratingId={regeneratingId}
                      onCopy={handleCopy}
                      onRegenerateBusinessQr={() => void handleRegenerateBusinessQr()}
                      onVenuePrint={(item, venueType, url) =>
                        void handleVenueQrPrint(item as CardItem, venueType, url)
                      }
                      onVenuePrintPdf={(item, venueType, url) =>
                        void handleVenuePrintPdf(item as CardItem, venueType, url)
                      }
                    />
                  </div>
                )}

                <div>
                  <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                    <UserCheck className="h-4 w-4 text-primary" />
                    {t("business.qrPage.staffTagsTitle")}
                  </h2>
                  <p className="mb-3 text-xs text-muted-foreground">
                    {t("business.qrPage.staffTagsDesc")}
                  </p>
                  {employees.length === 0 ? (
                    <div className={cn(businessUi.cardStatic, businessUi.chartEmpty, "py-12 text-center")}>
                      <p className="mb-2 text-muted-foreground">{t("business.qrPage.noEmployees")}</p>
                      <Link
                        to="/dashboard/staff-management"
                        className="text-sm font-semibold text-foreground underline underline-offset-2"
                      >
                        {t("business.qrPage.addStaffInManagement")}
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {employees.map((employee) => (
                        <QrManagementCard
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
                          }}
                          type="employee"
                          previewDataUrl={qrImages[employee.id]}
                          copiedId={copiedId}
                          qrLocked={qrLocked}
                          regeneratingId={regeneratingId}
                          onCopy={handleCopy}
                          onEmployeePrint={(item, url) => void handleEmployeePrint(item as CardItem, url)}
                          onEmployeePrintPdf={(item) => void handleEmployeePrintPdf(item as CardItem)}
                          onEmployeeRegenerate={onEmployeeRegenerateCard}
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
                <QrManagementCard
                  key={table.id}
                  item={{ ...table, role: table.location }}
                  type="table"
                  previewDataUrl={venueQrPreview[`tbl-${table.id}`]}
                  copiedId={copiedId}
                  qrLocked={qrLocked}
                  regeneratingId={regeneratingId}
                  onCopy={handleCopy}
                  onVenuePrint={(item, venueType, url) =>
                    void handleVenueQrPrint(item as CardItem, venueType, url)
                  }
                  onVenuePrintPdf={(item, venueType, url) =>
                    void handleVenuePrintPdf(item as CardItem, venueType, url)
                  }
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
                <QrManagementCard
                  key={location.id}
                  item={{ ...location, role: location.address }}
                  type="location"
                  previewDataUrl={venueQrPreview[`loc-${location.id}`]}
                  copiedId={copiedId}
                  qrLocked={qrLocked}
                  regeneratingId={regeneratingId}
                  onCopy={handleCopy}
                  onVenuePrint={(item, venueType, url) =>
                    void handleVenueQrPrint(item as CardItem, venueType, url)
                  }
                  onVenuePrintPdf={(item, venueType, url) =>
                    void handleVenuePrintPdf(item as CardItem, venueType, url)
                  }
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
