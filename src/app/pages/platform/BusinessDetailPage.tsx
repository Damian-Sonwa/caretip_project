import { useState, useEffect, useCallback } from "react";
import { Link, useParams } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Building2, CheckCircle, Shield, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  fetchPlatformBusiness,
  updatePlatformBusinessVerificationStatus,
  updatePlatformBusinessKyc,
  uploadPlatformBusinessLogo,
  uploadPlatformBusinessVerification,
  type PlatformBusinessRow,
  type PlatformVerificationAction,
} from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { CareTipPageLoader } from "../../components/CareTipPageLoader";

export function BusinessDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [row, setRow] = useState<PlatformBusinessRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    legalContactName: "",
    contactEmail: "",
    contactPhone: "",
    website: "",
    registeredAddress: "",
  });

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await fetchPlatformBusiness(id);
      setRow(res.business);
    } catch (e) {
      logClientError("BusinessDetailPage.load", e);
      toast.error(toUserFriendlyMessage(e));
      setRow(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!row) return;
    setForm({
      legalContactName: row.legalContactName ?? "",
      contactEmail: row.contactEmail ?? "",
      contactPhone: row.contactPhone ?? "",
      website: row.website ?? "",
      registeredAddress: row.registeredAddress ?? "",
    });
  }, [row]);

  const handleStatusUpdate = async (businessId: string, status: PlatformVerificationAction) => {
    try {
      await updatePlatformBusinessVerificationStatus(businessId, status);
      if (status === "verified") {
        toast.success("Business approved. They can generate QR codes.");
      } else if (status === "rejected") {
        toast.success("Business verification rejected.");
      } else {
        toast.success("Status updated.");
      }
      await load();
    } catch (e) {
      logClientError("BusinessDetailPage.handleStatusUpdate", e);
      toast.error(toUserFriendlyMessage(e));
    }
  };

  const saveKyc = async () => {
    if (!row) return;
    try {
      const { business } = await updatePlatformBusinessKyc(row.id, {
        legalContactName: form.legalContactName || null,
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
        website: form.website || null,
        registeredAddress: form.registeredAddress || null,
      });
      setRow(business);
      toast.success("Business details saved.");
      setEditing(false);
    } catch (e) {
      logClientError("BusinessDetailPage.saveKyc", e);
      toast.error(toUserFriendlyMessage(e));
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !row) return;
    try {
      await uploadPlatformBusinessLogo(row.id, f);
      toast.success("Logo uploaded successfully.");
      await load();
      e.target.value = "";
    } catch (err) {
      logClientError("BusinessDetailPage.handleLogoUpload", err);
      toast.error(toUserFriendlyMessage(err));
    }
  };

  const handleVerificationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f || !row) return;
    try {
      await uploadPlatformBusinessVerification(row.id, f);
      toast.success("Verification document uploaded successfully.");
      await load();
      e.target.value = "";
    } catch (err) {
      logClientError("BusinessDetailPage.handleVerificationUpload", err);
      toast.error(toUserFriendlyMessage(err));
    }
  };

  const statusBadge = (b: PlatformBusinessRow) => {
    if (b.verificationStatus === "verified") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-success px-2.5 py-1 text-sm font-medium text-success-foreground">
          <CheckCircle className="h-4 w-4" /> Verified
        </span>
      );
    }
    if (b.verificationStatus === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 text-sm font-medium">
          <XCircle className="w-4 h-4" /> Rejected
        </span>
      );
    }
    return <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">Pending</span>;
  };

  return (
    <>
      <main className="px-4 lg:px-8 py-8 pb-20">
            <div className="mb-6 text-sm">
              <Link
                to="/platform-admin/businesses"
                className="inline-flex items-center gap-2 text-accent hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to businesses
              </Link>
            </div>

            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2 flex items-center gap-2">
                <Shield className="w-7 h-7 text-accent" />
                Business details
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Review KYC data, approve or reject verification, and manage compliance files.
              </p>
            </div>

            {loading ? (
              <CareTipPageLoader variant="section" message="Loading business…" />
            ) : !id || !row ? (
              <p className="text-muted-foreground">Business not found.</p>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl p-6 max-w-2xl space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-6 h-6 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <h2 className="text-xl font-semibold text-foreground">{row.name}</h2>
                      <p className="text-sm text-muted-foreground font-mono">{row.slug}</p>
                      <p className="text-sm text-muted-foreground mt-1">{row.ownerEmail}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-start gap-2">{statusBadge(row)}</div>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Total tips (successful)</dt>
                    <dd className="font-medium">
                      €{(row.totalTipsEur ?? 0).toFixed(2)}{" "}
                      <span className="text-muted-foreground font-normal">
                        ({row.successTipCount ?? 0} tips)
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Legal contact</dt>
                    <dd className="font-medium">{row.legalContactName ?? "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Contact email</dt>
                    <dd className="font-medium break-all">{row.contactEmail ?? "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd className="font-medium">{row.contactPhone ?? "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Website</dt>
                    <dd className="font-medium break-all">{row.website ?? "N/A"}</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">Registered address</dt>
                    <dd className="font-medium whitespace-pre-wrap">{row.registeredAddress ?? "N/A"}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Staff / locations</dt>
                    <dd className="font-medium">
                      {row.staffCount ?? 0} staff · {row.locationCount ?? 0} locations
                    </dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-2">
                  {row.logoPath ? (
                    <a
                      href={row.logoPath}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-accent hover:underline"
                    >
                      Open logo
                    </a>
                  ) : null}
                  {row.verificationDocumentPath ? (
                    <a
                      href={row.verificationDocumentPath}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-accent hover:underline"
                    >
                      Open KYC document
                    </a>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="text-sm px-3 py-2 rounded-lg border border-border hover:bg-muted"
                  >
                    Edit details
                  </button>
                  {row.verificationStatus !== "verified" && (
                    <button
                      type="button"
                      onClick={() => void handleStatusUpdate(row.id, "verified")}
                      className="text-sm font-medium px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover"
                    >
                      Approve
                    </button>
                  )}
                  {row.verificationStatus === "pending" && (
                    <button
                      type="button"
                      onClick={() => void handleStatusUpdate(row.id, "rejected")}
                      className="text-sm font-medium px-3 py-2 rounded-lg border border-destructive text-destructive hover:bg-destructive/10"
                    >
                      Reject
                    </button>
                  )}
                </div>
              </motion.div>
            )}
      </main>

      {editing && row && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border border-border rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-lg font-semibold mb-1">Compliance: {row.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">Contact information</p>
            <div className="space-y-3">
              <label className="block text-sm">
                <span className="text-muted-foreground">Legal contact name</span>
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
                <span className="text-muted-foreground">Contact phone</span>
                <input
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={form.contactPhone}
                  onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                />
              </label>
              <label className="block text-sm">
                <span className="text-muted-foreground">Website</span>
                <input
                  className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
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
              <p className="text-sm font-medium text-foreground">Uploads</p>
              <label className="block text-sm">
                <span className="text-muted-foreground">Company logo (image)</span>
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
                onClick={() => setEditing(false)}
                className="px-4 py-2 rounded-lg border border-border text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void saveKyc()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary-hover"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
