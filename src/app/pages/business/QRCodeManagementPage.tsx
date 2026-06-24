import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router";
import {
  QrCode,
  Download,
  FileDown,
  Users,
  MapPin,
  LayoutGrid,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { useSubscriptionEntitlements } from "../../hooks/useSubscriptionEntitlements";
import { canUseProductionQr } from "../../lib/businessVerificationCapabilities";
import {
  getEmployees,
  fetchBusinessProfile,
  fetchBusinessBrandingSettings,
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
  validateBrandedQrReliability,
  downloadQrDataUrlPng,
  printQrDataUrl,
  isQrExportAllowed,
} from "../../lib/qrBranded";
import type { QrQualityGrade } from "../../lib/qrReliability";
import { qrBrandingForManager, BUSINESS_BRANDING_CHANGED_EVENT, qrBrandingFingerprint } from "../../lib/businessBranding";
import { loadQrStudioDesignExtras, mergeQrStudioBranding } from "../../lib/qrDesignSystem";
import {
  DEFAULT_QR_BACKGROUND_COLOR,
  DEFAULT_QR_BORDER_STYLE,
  DEFAULT_QR_SHAPE,
  DEFAULT_QR_TEMPLATE,
} from "../../lib/qrTemplateStyles";
import type { QrBrandingOptions } from "../../lib/businessBranding";
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
import { Card, CardContent } from "@/components/ui/card";
import { DASH_BTN_PRIMARY, DASH_BTN_SECONDARY } from "@/components/ui/dashboard-styles";
import { businessUi } from "@/app/components/business/businessDashboardUi";
import {
  QrManagementCard,
  type QrManagementCardItem,
} from "@/app/components/business/QrManagementCard";
import { cn } from "@/lib/utils";

const TOAST_OK = { style: { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } } as const;

type QrStudioViewMode = "gallery" | "employees" | "locations";

function resolveEmbeddedQrMode(pathname: string): QrStudioViewMode {
  if (pathname.includes("/qr-studio/employees")) return "employees";
  if (pathname.includes("/qr-studio/locations")) return "locations";
  return "gallery";
}

type QRCodeManagementPageProps = {
  /** When true, parent QR Studio shell provides page chrome. */
  embedded?: boolean;
  /** Which QR collection to show when embedded in QR Studio. */
  mode?: "gallery" | "employees" | "locations";
};

export function QRCodeManagementPage({
  embedded = false,
  mode = "gallery",
}: QRCodeManagementPageProps = {}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const viewMode: QrStudioViewMode = embedded ? resolveEmbeddedQrMode(pathname) : mode;
  const { user, authHydrated, sessionValidated, isBusiness } = useRequireAuth();
  const { tier } = useSubscriptionEntitlements({
    enabled: isBusiness,
    role: "business",
  });
  const [verificationStatus, setVerificationStatus] = useState<
    "pending" | "verified" | "rejected" | null
  >(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrImages, setQrImages] = useState<Record<string, string>>({});
  const [storefrontQr, setStorefrontQr] = useState<string>("");
  const [qrScanMeta, setQrScanMeta] = useState<
    Record<string, { grade: QrQualityGrade; exportAllowed: boolean }>
  >({});
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
  const [qrBrandingOpts, setQrBrandingOpts] = useState<QrBrandingOptions | null>(null);
  const employeeQrCacheKeyRef = useRef("");
  const venueQrCacheKeyRef = useRef("");

  const brandingFingerprint = useMemo(() => qrBrandingFingerprint(qrBrandingOpts), [qrBrandingOpts]);

  const loadQrBranding = useCallback(async () => {
    if (!user?.businessId || user.role !== "business") return;
    try {
      const s = await fetchBusinessBrandingSettings();
      const name =
        String(businessDisplayName ?? "").trim() ||
        String(user?.businessName ?? "").trim() ||
        t("business.qrPage.fallbackBusinessName");
      const base = qrBrandingForManager(tier, s, name);
      const extras = loadQrStudioDesignExtras(user.businessId);
      setQrBrandingOpts(mergeQrStudioBranding(base, extras));
    } catch (err) {
      logClientError("QRCodeManagementPage.branding", err);
      setQrBrandingOpts(
        qrBrandingForManager(
          tier,
          {
            logoPath: businessLogoPath,
            brandPrimaryColor: "#EB992C",
            brandSecondaryColor: "#000000",
            brandDisplayName: null,
            brandTagline: null,
            welcomeMessage: null,
            thankYouMessage: null,
            qrTemplate: DEFAULT_QR_TEMPLATE,
            qrBorderStyle: DEFAULT_QR_BORDER_STYLE,
            qrShape: DEFAULT_QR_SHAPE,
            qrAccentColor: "#EB992C",
            qrBackgroundColor: DEFAULT_QR_BACKGROUND_COLOR,
          },
          String(businessDisplayName ?? user?.businessName ?? "").trim() || "Business",
        ),
      );
    }
  }, [user?.businessId, user?.role, user?.businessName, tier, businessDisplayName, businessLogoPath, t]);

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

  useEffect(() => {
    void loadQrBranding();
  }, [loadQrBranding]);

  useEffect(() => {
    const onBrandingChanged = () => {
      employeeQrCacheKeyRef.current = "";
      venueQrCacheKeyRef.current = "";
      void loadQrBranding();
    };
    window.addEventListener(BUSINESS_BRANDING_CHANGED_EVENT, onBrandingChanged);
    return () => window.removeEventListener(BUSINESS_BRANDING_CHANGED_EVENT, onBrandingChanged);
  }, [loadQrBranding]);

  const qrBrand = qrBrandingOpts ?? undefined;

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
    const useCachedFirst = !quiet && Array.isArray(cached);
    if (useCachedFirst) {
      setEmployees(cached);
      setLoading(false);
    } else if (!quiet) {
      setLoading(true);
    }
    try {
      const list = await getEmployees(user.businessId);
      const normalized = Array.isArray(list) ? list : [];
      setEmployees(normalized);
      setPageSessionCache(cacheKey, normalized);
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
      setVenueLocations(Array.isArray(venueCached.locations) ? venueCached.locations : []);
      setVenueTables(Array.isArray(venueCached.tables) ? venueCached.tables : []);
    }
    void (async () => {
      const [locsResult, tbsResult] = await Promise.allSettled([fetchLocations(), fetchTables()]);
      if (cancelled) return;

      const locList =
        locsResult.status === "fulfilled" && Array.isArray(locsResult.value) ? locsResult.value : null;
      const tblList =
        tbsResult.status === "fulfilled" && Array.isArray(tbsResult.value) ? tbsResult.value : null;

      if (locsResult.status === "rejected") {
        logClientError("QRCodeManagementPage.venues.locations", locsResult.reason);
      }
      if (tbsResult.status === "rejected") {
        logClientError("QRCodeManagementPage.venues.tables", tbsResult.reason);
      }

      if (locList) setVenueLocations(locList);
      else if (!venueCached) setVenueLocations([]);

      if (tblList) setVenueTables(tblList);
      else if (!venueCached) setVenueTables([]);

      if (locList && tblList) {
        setPageSessionCache(venueCacheKey, { locations: locList, tables: tblList });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authHydrated, sessionValidated, user?.businessId, isBusiness]);

  const safeEmployees = Array.isArray(employees) ? employees : [];
  const safeVenueLocations = Array.isArray(venueLocations) ? venueLocations : [];
  const safeVenueTables = Array.isArray(venueTables) ? venueTables : [];

  const venueQrFingerprint = useMemo(
    () =>
      [
        ...safeVenueLocations.map((l) => `l:${l.id}`),
        ...safeVenueTables.map((t) => `t:${t.id}`),
      ].join("|"),
    [safeVenueLocations, safeVenueTables],
  );

  const employeeQrFingerprint = useMemo(
    () =>
      safeEmployees
        .map((e) => `${e.id}:${e.slug ?? ""}`)
        .sort()
        .join("|"),
    [safeEmployees],
  );

  useEffect(() => {
    if (!venueQrFingerprint || !brandingFingerprint) return;
    const cacheKey = `${venueQrFingerprint}|${brandingFingerprint}`;
    if (venueQrCacheKeyRef.current === cacheKey) return;
    let cancelled = false;
    (async () => {
      const next: Record<string, string> = {};
      const meta: Record<string, { grade: QrQualityGrade; exportAllowed: boolean }> = {};
      for (const loc of safeVenueLocations) {
        const url = qrLocationUrl(loc.id);
        try {
          const { canvas, report } = await validateBrandedQrReliability(url, qrBrand);
          next[`loc-${loc.id}`] = canvas?.toDataURL("image/png") ?? "";
          if (report) {
            meta[`loc-${loc.id}`] = { grade: report.grade, exportAllowed: report.exportAllowed };
          }
        } catch (err) {
          logClientError("QRCodeManagementPage", err);
          next[`loc-${loc.id}`] = "";
        }
      }
      for (const tbl of safeVenueTables) {
        const url = qrTableUrl(tbl.id);
        try {
          const { canvas, report } = await validateBrandedQrReliability(url, qrBrand);
          next[`tbl-${tbl.id}`] = canvas?.toDataURL("image/png") ?? "";
          if (report) {
            meta[`tbl-${tbl.id}`] = { grade: report.grade, exportAllowed: report.exportAllowed };
          }
        } catch (err) {
          logClientError("QRCodeManagementPage", err);
          next[`tbl-${tbl.id}`] = "";
        }
      }
      if (!cancelled) {
        venueQrCacheKeyRef.current = cacheKey;
        setVenueQrPreview(next);
        setQrScanMeta((prev) => ({ ...prev, ...meta }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [venueQrFingerprint, safeVenueLocations, safeVenueTables, qrBrand, brandingFingerprint]);

  useEffect(() => {
    const businessId = user?.businessId;
    if (!businessId || !brandingFingerprint) return;
    const cacheKey = `${businessId}|${businessSlug ?? ""}|${employeeQrFingerprint}|${brandingFingerprint}`;
    if (employeeQrCacheKeyRef.current === cacheKey) return;
    let cancelled = false;
    (async () => {
      const storeUrl = businessSlug
        ? businessDirectoryUrl(businessSlug)
        : qrLandingUrl(businessId);
      try {
        const { canvas, report } = await validateBrandedQrReliability(storeUrl, qrBrand);
        if (!cancelled) {
          setStorefrontQr(canvas?.toDataURL("image/png") ?? "");
          if (report) {
            setQrScanMeta((prev) => ({
              ...prev,
              storefront: { grade: report.grade, exportAllowed: report.exportAllowed },
            }));
          }
        }
      } catch (err) {
        logClientError("QRCodeManagementPage", err);
        if (!cancelled) setStorefrontQr("");
      }

      const next: Record<string, string> = {};
      const meta: Record<string, { grade: QrQualityGrade; exportAllowed: boolean }> = {};
      for (const e of safeEmployees) {
        if (!e.slug) {
          next[e.id] = "";
          continue;
        }
        try {
          const url = businessSlug
            ? publicEmployeeTipUrl(businessSlug, e.slug)
            : qrEmployeeLegacyUrl(e.id);
          const { canvas, report } = await validateBrandedQrReliability(url, qrBrand);
          next[e.id] = canvas?.toDataURL("image/png") ?? "";
          if (report) {
            meta[e.id] = { grade: report.grade, exportAllowed: report.exportAllowed };
          }
        } catch (err) {
          logClientError("QRCodeManagementPage", err);
          next[e.id] = "";
        }
      }
      if (!cancelled) {
        employeeQrCacheKeyRef.current = cacheKey;
        setQrImages(next);
        setQrScanMeta((prev) => ({ ...prev, ...meta }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [safeEmployees, employeeQrFingerprint, user?.businessId, businessSlug, qrBrand, brandingFingerprint]);

  const locations: Array<{ id: string; name: string; address: string; qrUrl: string }> =
    safeVenueLocations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      address: loc.description?.trim() || "N/A",
      qrUrl: qrLocationUrl(loc.id),
    }));

  const handleCopy = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scanMetaForKey = (key: string) => qrScanMeta[key];
  const isQrExportBlocked = (key: string) => scanMetaForKey(key)?.exportAllowed === false;

  type CardItem = {
    id: string;
    name: string;
    role?: string;
    avatar?: string | null;
    qrUrl: string;
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
        (Array.isArray(prev) ? prev : []).map((p) =>
          p.id === updated.id
            ? { ...p, slug: updated.slug, name: updated.name, role: updated.jobTitle }
            : p
        )
      );
      if (updated.slug) {
        const dataUrl = businessSlug
          ? await renderBrandedQRToDataUrl(businessSlug, updated.slug, qrBrand)
          : await renderBrandedQRToDataUrlLegacy(updated.id, qrBrand);
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
      return await renderBrandedQrUrlToDataUrl(item.qrUrl, qrBrand);
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
    const metaKey =
      type === "storefront" ? "storefront" : type === "location" ? `loc-${item.id}` : `tbl-${item.id}`;
    if (isQrExportBlocked(metaKey)) {
      toast.error(t("business.qrReliability.exportBlocked"));
      return;
    }
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
    if (!downloadQrDataUrlPng(dataUrl, `${prefix}.png`, { exportAllowed: true })) return;
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
      ? safeEmployees
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
    const emp = safeEmployees.find((e) => e.id === item.id);
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
      <div
        className={cn(
          "flex flex-col items-center justify-center text-foreground",
          embedded ? "py-12" : "min-h-screen bg-background px-6 pb-20",
        )}
      >
        <div className="max-w-lg space-y-4 text-center">
          <QrCode className="mx-auto h-14 w-14 opacity-40" />
          <h1 className="text-2xl font-bold">{t("business.qrPage.pendingTitle")}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("business.qrPage.pendingBody")}</p>
          {!embedded ? (
            <div className="flex flex-col items-center justify-center gap-2 sm:flex-row">
              <Button asChild variant="outline">
                <Link to="/dashboard">{t("business.qrPage.backDashboard")}</Link>
              </Button>
            </div>
          ) : null}
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

  const atAGlanceCard = !embedded ? (
    <Card className={businessUi.atAGlanceCard}>
      <CardContent className={businessUi.atAGlanceContent}>
        <p className={businessUi.atAGlanceLabel}>{t("business.qrPage.atAGlance")}</p>
            <div className={businessUi.atAGlanceGrid}>
          <div>
            <p className={businessUi.atAGlanceStatLabel}>{t("business.qrPage.statStaff")}</p>
            <p className={businessUi.atAGlanceStatValue}>{safeEmployees.length}</p>
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
  ) : null;

  const galleryInventoryCard = embedded && viewMode === "gallery" ? (
    <Card className={businessUi.atAGlanceCard}>
      <CardContent className={businessUi.atAGlanceContent}>
        <p className={businessUi.atAGlanceLabel}>{t("business.qrStudio.gallery.inventoryTitle")}</p>
        <p className="mb-3 text-xs text-muted-foreground">{t("business.qrStudio.gallery.inventoryDesc")}</p>
            <div className={businessUi.atAGlanceGrid}>
          <div>
            <p className={businessUi.atAGlanceStatLabel}>{t("business.qrStudio.gallery.statEmployees")}</p>
            <p className={businessUi.atAGlanceStatValue}>{safeEmployees.length}</p>
          </div>
          <div>
            <p className={businessUi.atAGlanceStatLabel}>{t("business.qrStudio.gallery.statLocations")}</p>
            <p className={businessUi.atAGlanceStatValue}>{safeVenueLocations.length}</p>
          </div>
          <div>
            <p className={businessUi.atAGlanceStatLabel}>{t("business.qrStudio.gallery.statTables")}</p>
            <p className={businessUi.atAGlanceStatValue}>{safeVenueTables.length}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  ) : null;

  const quickAccessLinks = [
    {
      href: "/dashboard/qr-studio/employees",
      labelKey: "business.qrStudio.gallery.manageEmployees",
      icon: Users,
      count: safeEmployees.length,
    },
    {
      href: "/dashboard/qr-studio/locations",
      labelKey: "business.qrStudio.gallery.manageLocations",
      icon: MapPin,
      count: safeVenueLocations.length,
    },
    {
      href: "/dashboard/qr-studio/tables",
      labelKey: "business.qrStudio.gallery.manageTables",
      icon: LayoutGrid,
      count: safeVenueTables.length,
    },
  ] as const;

  return (
    <div className={cn(embedded ? "text-foreground" : "min-h-screen bg-background pb-20 text-foreground")}>
      <div className={embedded ? "space-y-6" : businessUi.subPageTop}>
        {!embedded ? (
          <>
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
                    disabled={qrLocked || bulkPdfLoading || safeEmployees.length === 0}
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
          </>
        ) : null}

        {atAGlanceCard}
        {galleryInventoryCard}
      </div>

      {qrLocked ? (
        <div className="w-full px-4 sm:px-6">
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm">
            <p className="font-semibold text-foreground">{t("business.qrPage.reviewBody")}</p>
            <p className="mt-1 text-muted-foreground">{t("business.qrPage.qrLockedSub")}</p>
          </div>
        </div>
      ) : null}

      <TracingBeam className={cn(embedded ? "mt-6" : businessUi.subPageMain, "pb-4")}>
        <div className="space-y-6">
          <div className="w-full min-w-0">
            {viewMode === "gallery" && user?.businessId ? (
              <div className="space-y-6">
                <div>
                  <h2 className="mb-1 text-base font-semibold text-foreground">
                    {t("business.qrStudio.gallery.mainVenueTitle")}
                  </h2>
                  <p className="mb-3 text-sm text-muted-foreground">{t("business.qrPage.storefrontQrDesc")}</p>
                  <p className="mb-3 text-xs text-muted-foreground">
                    {t("business.qrPage.storefrontQrUrlLabel")}{" "}
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
                    exportBlocked={isQrExportBlocked("storefront")}
                  />
                </div>

                <Card className={businessUi.cardStatic}>
                  <CardContent className="space-y-3 pt-6">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        {t("business.qrStudio.gallery.quickAccessTitle")}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {t("business.qrStudio.gallery.quickAccessDesc")}
                      </p>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {quickAccessLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                          <Link
                            key={link.href}
                            to={link.href}
                            className={cn(
                              businessUi.cardStatic,
                              "flex items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-primary/[0.04]",
                            )}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                              <span className="truncate">{t(link.labelKey)}</span>
                            </span>
                            <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
                              <span className="text-xs tabular-nums">{link.count}</span>
                              <ChevronRight className="h-4 w-4" aria-hidden />
                            </span>
                          </Link>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {viewMode === "employees" ? (
              loading && safeEmployees.length === 0 ? (
                <DashboardListSkeleton rows={5} minHeightClass="min-h-[240px]" />
              ) : (
                <div>
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h2 className="text-base font-semibold text-foreground">
                        {t("business.qrStudio.employees.pageTitle")}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t("business.qrStudio.employees.pageDesc")}
                      </p>
                    </div>
                    {embedded ? (
                      <Button
                        type="button"
                        className={cn(businessUi.btnPrimary, "shrink-0")}
                        onClick={handleGenerateAllPdf}
                        disabled={qrLocked || bulkPdfLoading || safeEmployees.length === 0}
                      >
                        {bulkPdfLoading ? (
                          <LoadingSpinner size="sm" className="mr-2 shrink-0" />
                        ) : (
                          <FileDown className="mr-2 h-4 w-4 shrink-0" />
                        )}
                        {t("business.qrPage.allPdfs")}
                      </Button>
                    ) : null}
                  </div>
                  {safeEmployees.length === 0 ? (
                    <div className={cn(businessUi.cardStatic, businessUi.chartEmpty, "py-12 text-center")}>
                      <p className="mb-2 text-muted-foreground">{t("business.qrPage.noEmployees")}</p>
                      <Link
                        to="/dashboard/team/employees"
                        className="text-sm font-semibold text-foreground underline underline-offset-2"
                      >
                        {t("business.qrPage.addStaffInManagement")}
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {safeEmployees.map((employee) => (
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
                          exportBlocked={isQrExportBlocked(employee.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            ) : null}

            {viewMode === "locations" ? (
              <div className="space-y-4">
                <div>
                  <h2 className="text-base font-semibold text-foreground">
                    {t("business.qrStudio.locations.pageTitle")}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t("business.qrStudio.locations.pageDesc")}
                  </p>
                </div>
                {locations.length === 0 ? (
                  <div className="py-16 text-center text-muted-foreground">
                    <p className="mb-6">{t("business.qrPage.noLocations")}</p>
                    <Link
                      to="/dashboard/locations"
                      className="text-sm font-semibold text-foreground underline underline-offset-2"
                    >
                      {t("business.qrPage.addLocations")}
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
                      exportBlocked={isQrExportBlocked(`loc-${location.id}`)}
                    />
                  ))
                )}
              </div>
            ) : null}
          </div>
        </div>
      </TracingBeam>
    </div>
  );
}
