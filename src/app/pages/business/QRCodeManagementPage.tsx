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
  ArrowRight,
  LayoutGrid,
} from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import {
  getEmployees,
  fetchBusinessProfile,
  regenerateEmployeeSlug,
  fetchLocations,
  fetchTables,
  type EmployeeItem,
  type LocationDTO,
  type TableDTO,
} from "../../lib/api";
import { LoadingSpinner } from "../../components/ui/loading-spinner";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import {
  renderBrandedQRToDataUrl,
  downloadBrandedQR,
  downloadQrDataUrlPng,
  printQrDataUrl,
} from "../../lib/qrBranded";
import { downloadBusinessQrPrintPdf, downloadEmployeeQrPrintPdf } from "../../lib/qrPrintPdf";
import {
  businessDirectoryUrl,
  qrBusinessUrl,
  qrEmployeeUrl,
  qrLandingUrl,
  qrLocationUrl,
  qrTableUrl,
} from "../../lib/appPublicUrl";
import { downloadStaffQrPdf } from "../../lib/qrBulkPdf";
import { logClientError } from "../../lib/clientLog";
import { DashboardHero } from "@/components/ui/dashboard-hero";
import { TracingBeam } from "@/components/ui/tracing-beam";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dashStatCard, DASH_BTN_PRIMARY, DASH_BTN_SECONDARY } from "@/components/ui/dashboard-styles";

/** Dark modules for scannable QR */
const QR_MODULE_DARK = "#000000";

const TOAST_OK = { style: { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } } as const;

export function QRCodeManagementPage() {
  const { user, isBusiness, updateUser } = useRequireAuth();
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

  useEffect(() => {
    if (!user?.businessId || user.role !== "business") return;
    let cancelled = false;
    void fetchBusinessProfile()
      .then((p) => {
        if (cancelled) return;
        setBusinessSlug(p.slug?.trim() || null);
        setBusinessDisplayName(String(p.name ?? "").trim() || null);
        setBusinessLocation(String(p.location ?? "").trim() || null);
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
        if (user.status === "APPROVED") setVerificationStatus("verified");
        else if (user.status === "REJECTED") setVerificationStatus("rejected");
        else setVerificationStatus("pending");
      });
    return () => {
      cancelled = true;
    };
  }, [user?.businessId, user?.role, user?.status, updateUser]);

  const loadEmployees = useCallback(async () => {
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
      toast.error("Could not load staff list.");
    } finally {
      setLoading(false);
    }
  }, [user?.businessId]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
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
  }, [user?.businessId, isBusiness]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (typeof window === "undefined") return;
      const next: Record<string, string> = {};
      for (const loc of venueLocations) {
        const url = qrLocationUrl(loc.id);
        try {
          next[`loc-${loc.id}`] = await QRCode.toDataURL(url, {
            width: 256,
            margin: 2,
            color: { dark: QR_MODULE_DARK, light: "#ffffff" },
            errorCorrectionLevel: "M",
          });
        } catch (err) {
          logClientError("QRCodeManagementPage", err);
          next[`loc-${loc.id}`] = "";
        }
      }
      for (const t of venueTables) {
        const url = qrTableUrl(t.id);
        try {
          next[`tbl-${t.id}`] = await QRCode.toDataURL(url, {
            width: 256,
            margin: 2,
            color: { dark: QR_MODULE_DARK, light: "#ffffff" },
            errorCorrectionLevel: "M",
          });
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
        const sf = await QRCode.toDataURL(storeUrl, {
          width: 256,
          margin: 2,
          color: { dark: QR_MODULE_DARK, light: "#ffffff" },
          errorCorrectionLevel: "M",
        });
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
          next[e.id] = await renderBrandedQRToDataUrl(e.id);
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
        const dataUrl = await renderBrandedQRToDataUrl(updated.id);
        setQrImages((prev) => ({ ...prev, [employee.id]: dataUrl }));
      }
      toast.success("QR link saved. New CareTip QR is ready.", TOAST_OK);
    } catch (err) {
      logClientError("QRCodeManagementPage", err);
      toast.error("Could not generate QR. Try again.");
    } finally {
      setRegeneratingId(null);
    }
  };

  const buildVenueQrDataUrl = async (
    item: CardItem,
    previewDataUrl: string | undefined
  ): Promise<string | null> => {
    if (previewDataUrl) return previewDataUrl;
    if (!item.qrUrl) return null;
    try {
      return await QRCode.toDataURL(item.qrUrl, {
        width: 256,
        margin: 2,
        color: { dark: QR_MODULE_DARK, light: "#ffffff" },
        errorCorrectionLevel: "M",
      });
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
      toast.error("QR image not ready. Wait a moment and try again.");
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
    toast.success("QR downloaded.", TOAST_OK);
  };

  const handleVenueQrPrint = async (
    item: CardItem,
    previewDataUrl: string | undefined,
    heading: string
  ) => {
    const dataUrl = await buildVenueQrDataUrl(item, previewDataUrl);
    if (!dataUrl) {
      toast.error("QR image not ready. Wait a moment and try again.");
      return;
    }
    const ok = printQrDataUrl(dataUrl, heading);
    if (!ok) {
      toast.error("Allow pop-ups to print, or use Download.");
    }
  };

  const handleGenerateAllPdf = async () => {
    const staff = employees.map((e) => ({ id: e.id, name: e.name }));
    if (staff.length === 0) {
      toast.error("Add staff first.");
      return;
    }
    setBulkPdfLoading(true);
    try {
      const dateStr = new Date().toISOString().slice(0, 10);
      await downloadStaffQrPdf(staff, `CareTip_QR_All_${dateStr}`);
      toast.success("PDF ready to print.", TOAST_OK);
    } catch (err) {
      logClientError("QRCodeManagementPage", err);
      toast.error("Could not build PDF.");
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
      toast.error("QR image not ready. Wait a moment and try again.");
      return;
    }
    try {
      const displayBusinessName =
        String(businessDisplayName ?? "").trim() || String(user?.businessName ?? "").trim() || "Business";
      await downloadBusinessQrPrintPdf({
        qrPngDataUrl: dataUrl,
        businessName: displayBusinessName,
        location:
          type === "storefront"
            ? String(businessLocation ?? "").trim() || null
            : type === "table"
              ? item.location
              : item.address,
        instruction: "Scan to tip instantly",
        fileBaseName:
          type === "storefront"
            ? `CareTip_QR_${displayBusinessName}`
            : type === "table"
              ? `CareTip_QR_Table_${displayBusinessName}_${item.name}`
              : `CareTip_QR_Location_${displayBusinessName}_${item.name}`,
      });
    } catch (err) {
      logClientError("QRCodeManagementPage.printPdf", err);
      toast.error("Could not build PDF.");
    }
  };

  const handleEmployeePrintPdf = async (item: CardItem) => {
    const dataUrl = qrImages[item.id];
    if (!dataUrl) {
      toast.error("QR image not ready. Wait a moment and try again.");
      return;
    }
    try {
      await downloadEmployeeQrPrintPdf({
        qrPngDataUrl: dataUrl,
        employeeName: item.name,
        businessName: user?.businessName ?? "CareTip",
        instruction: "Scan to tip",
        fileBaseName: `CareTip_QR_${item.name}`,
      });
    } catch (err) {
      logClientError("QRCodeManagementPage.employeePrintPdf", err);
      toast.error("Could not build PDF.");
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
          <div className="flex h-36 w-36 items-center justify-center rounded-lg border border-black/[0.10] bg-white p-2">
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
                <p className="text-sm text-muted-foreground">Team QR • Entrance / front counter</p>
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
            <p className="mb-1 text-xs text-muted-foreground">QR code URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 truncate font-mono text-xs text-foreground">{item.qrUrl}</code>
              <button
                type="button"
                onClick={() => handleCopy(item.id, item.qrUrl)}
                className="flex-shrink-0 rounded-lg p-2 transition-colors hover:bg-background"
                aria-label="Copy URL"
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
              <span>Total scans: </span>
              <span className="font-semibold text-foreground">{item.scans}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {type === "employee" && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => downloadBrandedQR(item.id, item.name)}
                    disabled={qrLocked}
                    className={DASH_BTN_PRIMARY}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleEmployeePrintPdf(item)}
                    disabled={qrLocked || !previewDataUrl}
                    className={DASH_BTN_SECONDARY}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Print layout (PDF)
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
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      void handleVenueQrDownload(
                        item,
                        type,
                        previewDataUrl
                      )
                    }
                    disabled={qrLocked}
                    className={DASH_BTN_PRIMARY}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      void handleVenueQrPrint(
                        item,
                        previewDataUrl,
                        type === "storefront"
                          ? String(businessDisplayName ?? "").trim() || user?.businessName || "Business"
                          : type === "table"
                            ? `Table: ${item.name}`
                            : `Location: ${item.name}`
                      )
                    }
                    disabled={qrLocked}
                    className={DASH_BTN_SECONDARY}
                  >
                    <Printer className="mr-2 h-4 w-4" />
                    Print
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void handleVenuePrintPdf(item, type, previewDataUrl)}
                    disabled={qrLocked || !previewDataUrl}
                    className={DASH_BTN_SECONDARY}
                  >
                    <FileDown className="mr-2 h-4 w-4" />
                    Print layout (PDF)
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
    return <CareTipPageLoader message="Loading…" />;
  }

  const statusLabel =
    verificationStatus === "verified"
      ? "Verified"
      : verificationStatus === "rejected"
        ? "Rejected"
        : "Pending";

  return (
    <div className="min-h-screen bg-background pb-20 text-foreground">
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
          hideImage
          badge={
            <>
              <QrCode className="h-3.5 w-3.5 text-foreground" />
              {qrLocked ? "Pending Verification" : "Printable & shareable"}
            </>
          }
          title="QR code management"
          description={
            businessSlug
              ? `Team directory: ${businessDirectoryUrl(businessSlug)}`
              : "Generate staff and storefront codes. Black modules on white for clean scans. Actions use yellow with black text."
          }
          overview={
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Staff</p>
                <p className="text-lg font-bold tabular-nums text-foreground">{employees.length}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Status</p>
                <p className="text-lg font-bold text-foreground">{statusLabel}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Slug</p>
                <p className="text-lg font-bold text-foreground">{businessSlug ? "Live" : "N/A"}</p>
              </div>
            </div>
          }
          shortcuts={
            <>
              <Link
                to="/dashboard/staff-management"
                className="flex items-center justify-between rounded-lg px-2 py-2 font-medium text-foreground hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Staff management
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/dashboard/locations"
                className="flex items-center justify-between rounded-lg px-2 py-2 font-medium text-foreground hover:bg-muted"
              >
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Locations
                </span>
                <ArrowRight className="h-4 w-4" />
              </Link>
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
            </>
          }
          actions={
            <Button
              type="button"
              onClick={handleGenerateAllPdf}
              disabled={qrLocked || bulkPdfLoading || employees.length === 0}
            >
              {bulkPdfLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <FileDown className="mr-2 h-4 w-4" />}
              Generate all PDF
            </Button>
          }
        />
      </div>

      {qrLocked ? (
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm">
            <p className="font-semibold text-foreground">Your account is under review.</p>
            <p className="mt-1 text-muted-foreground">
              QR features will be available once your account is verified.
            </p>
          </div>
        </div>
      ) : null}

      <TracingBeam className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="space-y-6 py-4">
          <Card className="border-2 border-border shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Sections</CardTitle>
              <CardDescription>Employees, tables, and locations</CardDescription>
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
                  <span className="hidden sm:inline">Employees</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("tables")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all sm:flex-initial ${
                    activeTab === "tables" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  <span className="hidden sm:inline">Tables</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("locations")}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-all sm:flex-initial ${
                    activeTab === "locations" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">Locations</span>
                </button>
              </div>
            </CardContent>
          </Card>

      <div className="max-w-7xl">
        {activeTab === "employees" && (
          <>
            {loading ? (
              <CareTipPageLoader variant="section" message="Loading team members…" />
            ) : (
              <div className="space-y-8">
                {user?.businessId && (
                  <div>
                    <h2 className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                      <Store className="h-4 w-4 text-primary" />
                      {String(businessDisplayName ?? "").trim() || user?.businessName || "Business"} QR
                    </h2>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Place at the entrance. Customers scan to choose who to tip.
                    </p>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Same page:{" "}
                      <code className="break-all font-mono text-[11px] text-foreground/90">
                        {qrBusinessUrl(user.businessId)}
                      </code>
                    </p>
                    <QRCard
                      item={{
                        id: "storefront",
                        name: String(businessDisplayName ?? "").trim() || user?.businessName || "Business",
                        qrUrl: qrLandingUrl(user.businessId),
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
                    Individual QR codes for each team member. Uses your staff profile link (CareTip Limited branded).
                  </p>
                  {employees.length === 0 ? (
                    <div className="rounded-xl border-2 border-border bg-card py-12 text-center">
                      <p className="mb-2 text-muted-foreground">No employees yet.</p>
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
                            qrUrl: qrEmployeeUrl(employee.id),
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
                <p className="mb-6">No tables configured.</p>
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
                <p className="mb-6">No locations configured.</p>
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
