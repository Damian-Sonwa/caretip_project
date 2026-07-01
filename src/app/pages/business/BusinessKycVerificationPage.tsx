import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Clock, FileUp, Loader2, Upload, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { useRealtimeFallback } from "../../hooks/useRealtimeFallback";
import {
  fetchKycStatus,
  submitKycForReview,
  uploadKycDocument,
  type KycDocumentType,
  type KycStatusResponse,
  type KycUiStatus,
} from "../../lib/api";
import { logClientError } from "../../lib/clientLog";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { cn } from "@/lib/utils";
import { MVP_KYC_DOCUMENT_UPLOAD_ENABLED } from "../../lib/mvpVerificationPolicy";
import { BusinessKycComingSoonPage } from "./BusinessKycComingSoonPage";

const DOC_SLOTS: Array<{ type: KycDocumentType; labelKey: string }> = [
  { type: "registration", labelKey: "business.kyc.docRegistration" },
  { type: "address", labelKey: "business.kyc.docAddress" },
  { type: "governmentId", labelKey: "business.kyc.docGovernmentId" },
];

function statusIcon(status: KycUiStatus) {
  if (status === "APPROVED") return <CheckCircle2 className="size-5 text-emerald-600" />;
  if (status === "REJECTED") return <XCircle className="size-5 text-destructive" />;
  if (status === "UNDER_REVIEW") return <Clock className="size-5 text-amber-600" />;
  return <FileUp className="size-5 text-muted-foreground" />;
}

export function BusinessKycVerificationPage() {
  if (!MVP_KYC_DOCUMENT_UPLOAD_ENABLED) {
    return <BusinessKycComingSoonPage />;
  }
  return <BusinessKycVerificationPageLive />;
}

function BusinessKycVerificationPageLive() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<KycStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<KycDocumentType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sync = useCallback(async () => {
    if (!user || user.role !== "business" || user.impersonation) return;
    try {
      const s = await fetchKycStatus();
      setStatus(s);
      updateUser({
        kycVerificationStatus:
          s.kycUiStatus === "APPROVED"
            ? "verified"
            : s.kycUiStatus === "REJECTED"
              ? "rejected"
              : s.kycUiStatus === "UNDER_REVIEW"
                ? "pending_review"
                : "awaiting_upload",
      });
      if (s.kycUiStatus === "APPROVED") {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      logClientError("BusinessKycVerificationPage.sync", err);
    } finally {
      setLoading(false);
    }
  }, [user, navigate, updateUser]);

  const { socket, connected } = useSocket(
    Boolean(user && user.role === "business" && !user.impersonation),
  );
  useRealtimeFallback(connected, sync, 45_000);

  useEffect(() => {
    void sync();
  }, [sync]);

  useEffect(() => {
    if (!socket || user?.role !== "business" || user.impersonation) return;
    const h = () => void sync();
    socket.on("verification_updated", h);
    return () => {
      socket.off("verification_updated", h);
    };
  }, [socket, user?.role, user?.impersonation, sync]);

  const onUpload = async (type: KycDocumentType, file: File) => {
    setUploading(type);
    try {
      const r = await uploadKycDocument(type, file);
      toast.success(t("business.kyc.uploadSuccess"));
      setStatus((prev) =>
        prev
          ? {
              ...prev,
              kycUiStatus: r.kycUiStatus,
              kycDocuments: r.kycDocuments,
            }
          : prev,
      );
    } catch (err) {
      toast.error(toUserFriendlyMessage(err));
    } finally {
      setUploading(null);
    }
  };

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      const r = await submitKycForReview();
      setStatus(r);
      toast.success(t("business.kyc.submitSuccess"));
      updateUser({ kycVerificationStatus: "pending_review" });
    } catch (err) {
      toast.error(toUserFriendlyMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const kycStatus = status?.kycUiStatus ?? "PENDING_UPLOAD";
  const docs = status?.kycDocuments ?? {};
  const canSubmit =
    kycStatus !== "APPROVED" &&
    kycStatus !== "UNDER_REVIEW" &&
    DOC_SLOTS.every((s) => Boolean(docs[s.type]));
  const mvpStatusOnly = !MVP_KYC_DOCUMENT_UPLOAD_ENABLED;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <div className="text-center space-y-2">
        <div className="flex justify-center">{statusIcon(kycStatus)}</div>
        <h1 className="text-2xl font-semibold text-foreground">
          {mvpStatusOnly
            ? kycStatus === "REJECTED"
              ? t("business.verification.rejectedPageTitle")
              : t("business.verification.pendingPageTitle")
            : kycStatus === "REJECTED"
              ? t("business.kyc.titleRejected")
              : kycStatus === "UNDER_REVIEW"
                ? t("business.kyc.titleReview")
                : t("business.kyc.titleUpload")}
        </h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {mvpStatusOnly
            ? kycStatus === "REJECTED"
              ? t("business.verification.rejectedPageBody")
              : t("business.verification.pendingPageBody")
            : kycStatus === "REJECTED"
              ? t("business.kyc.bodyRejected")
              : kycStatus === "UNDER_REVIEW"
                ? t("business.kyc.bodyReview")
                : t("business.kyc.bodyUpload")}
        </p>
        {mvpStatusOnly ? (
          <>
            <p className="text-sm text-muted-foreground">{t("business.verification.mvpLiveGateNote")}</p>
            <p className="text-sm text-muted-foreground">{t("business.verification.mvpReviewInProgress")}</p>
          </>
        ) : (
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            {t(`business.kyc.status.${kycStatus}`)}
          </p>
        )}
      </div>

      {!mvpStatusOnly && kycStatus !== "UNDER_REVIEW" && kycStatus !== "APPROVED" ? (
        <div className="space-y-4">
          {DOC_SLOTS.map((slot) => {
            const uploaded = Boolean(docs[slot.type]);
            return (
              <label
                key={slot.type}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-xl border p-4 cursor-pointer transition-colors",
                  uploaded ? "border-emerald-500/40 bg-emerald-500/5" : "border-border hover:bg-muted/40",
                )}
              >
                <div className="min-w-0">
                  <p className="font-medium text-sm">{t(slot.labelKey)}</p>
                  <p className="text-xs text-muted-foreground">
                    {uploaded ? t("business.kyc.uploaded") : t("business.kyc.tapToUpload")}
                  </p>
                </div>
                <div className="shrink-0">
                  {uploading === slot.type ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : uploaded ? (
                    <CheckCircle2 className="size-5 text-emerald-600" />
                  ) : (
                    <Upload className="size-5 text-muted-foreground" />
                  )}
                </div>
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*,.pdf,.doc,.docx"
                  disabled={uploading !== null}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void onUpload(slot.type, f);
                    e.target.value = "";
                  }}
                />
              </label>
            );
          })}

          <label className="flex items-center justify-between gap-3 rounded-xl border border-dashed p-4 cursor-pointer hover:bg-muted/40">
            <div>
              <p className="font-medium text-sm">{t("business.kyc.docAdditional")}</p>
              <p className="text-xs text-muted-foreground">{t("business.kyc.optional")}</p>
            </div>
            <Upload className="size-5 text-muted-foreground shrink-0" />
            <input
              type="file"
              className="sr-only"
              accept="image/*,.pdf,.doc,.docx"
              disabled={uploading !== null}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onUpload("additional", f);
                e.target.value = "";
              }}
            />
          </label>

          <button
            type="button"
            disabled={!canSubmit || submitting}
            onClick={() => void onSubmit()}
            className="w-full rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {submitting ? t("business.kyc.submitting") : t("business.kyc.submitForReview")}
          </button>
        </div>
      ) : null}

      {status?.timeline?.length ? (
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">{t("business.kyc.timelineTitle")}</h2>
          <ul className="space-y-2 text-sm">
            {status.timeline.map((entry, i) => (
              <li key={`${entry.at}-${i}`} className="flex gap-2 text-muted-foreground">
                <span className="text-foreground font-medium shrink-0">
                  {new Date(entry.at).toLocaleString()}
                </span>
                <span>{entry.label}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-2 justify-center">
        <Link
          to="/dashboard"
          className="inline-flex justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          {t("business.verification.goToDashboard")}
        </Link>
        <Link
          to="/dashboard/support"
          className="inline-flex justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          {t("business.kyc.contactSupport")}
        </Link>
        <Link
          to="/"
          className="inline-flex justify-center rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          {t("business.verification.home")}
        </Link>
      </div>
    </div>
  );
}
