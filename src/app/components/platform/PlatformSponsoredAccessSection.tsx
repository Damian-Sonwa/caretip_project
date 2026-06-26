import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Gift, Loader2, Pencil, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import {
  activateBusinessSponsoredAccess,
  createBusinessSponsoredAccess,
  fetchBusinessSponsoredAccess,
  fetchSponsoredProgrammes,
  revokeBusinessSponsoredAccess,
  updateBusinessSponsoredAccess,
  type SponsoredAccessGrant,
  type SponsoredCapabilityProfileKey,
  type SponsoredProgrammeOption,
} from "../../lib/api";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { platformUi } from "./platformDashboardUi";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { cn } from "@/lib/utils";

type PlatformSponsoredAccessSectionProps = {
  businessId: string;
};

type GrantFormState = {
  programmeKey: string;
  capabilityProfileKey: SponsoredCapabilityProfileKey | "";
  expiresAt: string;
  notes: string;
};

function formatAdminDate(iso: string | null, locale: string, neverLabel: string): string {
  if (!iso) return neverLabel;
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 10);
  }
}

function pickDisplayGrant(grants: SponsoredAccessGrant[]): SponsoredAccessGrant | null {
  return (
    grants.find((g) => g.status === "active") ??
    grants.find((g) => g.status === "pending") ??
    grants[0] ??
    null
  );
}

function defaultProfileForProgramme(
  programmes: SponsoredProgrammeOption[],
  programmeKey: string,
): SponsoredCapabilityProfileKey {
  return programmes.find((p) => p.programmeKey === programmeKey)?.profileKey ?? "business";
}

function profileKeyForGrant(
  grant: SponsoredAccessGrant,
  programmes: SponsoredProgrammeOption[],
): SponsoredCapabilityProfileKey {
  return (
    grant.effectiveProfileKey ??
    (grant.capabilityProfileKey as SponsoredCapabilityProfileKey | null) ??
    defaultProfileForProgramme(programmes, grant.programmeKey)
  );
}

export function PlatformSponsoredAccessSection({ businessId }: PlatformSponsoredAccessSectionProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith("de") ? "de-DE" : "en-GB";
  const neverLabel = t("admin.businessDetailPage.sponsoredAccess.never");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [programmes, setProgrammes] = useState<SponsoredProgrammeOption[]>([]);
  const [profileOptions, setProfileOptions] = useState<
    Array<{ profileKey: SponsoredCapabilityProfileKey; labelKey: string }>
  >([]);
  const [grants, setGrants] = useState<SponsoredAccessGrant[]>([]);
  const [modalMode, setModalMode] = useState<"grant" | "edit" | null>(null);
  const [form, setForm] = useState<GrantFormState>({
    programmeKey: "",
    capabilityProfileKey: "",
    expiresAt: "",
    notes: "",
  });

  const displayGrant = useMemo(() => pickDisplayGrant(grants), [grants]);
  const canGrant = !grants.some((g) => g.status === "active" || g.status === "pending");
  const canEdit =
    displayGrant != null &&
    (displayGrant.status === "active" || displayGrant.status === "pending");
  const canRevoke = displayGrant?.status === "active" || displayGrant?.status === "pending";
  const canActivate = displayGrant?.status === "pending";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [programmeRes, grantRes] = await Promise.all([
        fetchSponsoredProgrammes(),
        fetchBusinessSponsoredAccess(businessId),
      ]);
      setProgrammes(programmeRes.programmes);
      setProfileOptions(programmeRes.capabilityProfiles);
      setGrants(grantRes.grants);
    } catch (e) {
      logClientError("PlatformSponsoredAccessSection.load", e);
      toast.error(toUserFriendlyMessage(e));
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  const openGrantModal = () => {
    const firstProgramme = programmes[0]?.programmeKey ?? "";
    setForm({
      programmeKey: firstProgramme,
      capabilityProfileKey: firstProgramme
        ? defaultProfileForProgramme(programmes, firstProgramme)
        : "",
      expiresAt: "",
      notes: "",
    });
    setModalMode("grant");
  };

  const openEditModal = () => {
    if (!displayGrant) return;
    setForm({
      programmeKey: displayGrant.programmeKey,
      capabilityProfileKey: profileKeyForGrant(displayGrant, programmes),
      expiresAt: displayGrant.expiresAt ? displayGrant.expiresAt.slice(0, 10) : "",
      notes: displayGrant.notes ?? "",
    });
    setModalMode("edit");
  };

  const closeModal = () => setModalMode(null);

  const handleProgrammeChange = (programmeKey: string) => {
    setForm((prev) => ({
      ...prev,
      programmeKey,
      capabilityProfileKey: defaultProfileForProgramme(programmes, programmeKey),
    }));
  };

  const submitForm = async () => {
    if (!form.programmeKey) {
      toast.error(t("admin.businessDetailPage.sponsoredAccess.toastProgrammeRequired"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        programmeKey: form.programmeKey,
        capabilityProfileKey: form.capabilityProfileKey || null,
        notes: form.notes.trim() || null,
        expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59.999Z`).toISOString() : null,
      };

      if (modalMode === "grant") {
        await createBusinessSponsoredAccess(businessId, { ...payload, activate: true });
        toast.success(t("admin.businessDetailPage.sponsoredAccess.toastGranted"));
      } else if (modalMode === "edit" && displayGrant) {
        await updateBusinessSponsoredAccess(businessId, displayGrant.id, {
          programmeKey: payload.programmeKey,
          capabilityProfileKey: payload.capabilityProfileKey,
          notes: payload.notes,
          ...(form.expiresAt
            ? { expiresAt: payload.expiresAt ?? undefined }
            : { clearExpiresAt: true }),
        });
        toast.success(t("admin.businessDetailPage.sponsoredAccess.toastUpdated"));
      }
      closeModal();
      await load();
    } catch (e) {
      logClientError("PlatformSponsoredAccessSection.submit", e);
      toast.error(toUserFriendlyMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async () => {
    if (!displayGrant) return;
    if (!window.confirm(t("admin.businessDetailPage.sponsoredAccess.revokeConfirm"))) return;
    setSaving(true);
    try {
      await revokeBusinessSponsoredAccess(businessId, displayGrant.id);
      toast.success(t("admin.businessDetailPage.sponsoredAccess.toastRevoked"));
      await load();
    } catch (e) {
      logClientError("PlatformSponsoredAccessSection.revoke", e);
      toast.error(toUserFriendlyMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async () => {
    if (!displayGrant) return;
    setSaving(true);
    try {
      await activateBusinessSponsoredAccess(businessId, displayGrant.id);
      toast.success(t("admin.businessDetailPage.sponsoredAccess.toastActivated"));
      await load();
    } catch (e) {
      logClientError("PlatformSponsoredAccessSection.activate", e);
      toast.error(toUserFriendlyMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const statusLabel = (grant: SponsoredAccessGrant | null) => {
    if (!grant) return t("admin.businessDetailPage.sponsoredAccess.statusNone");
    return t(`admin.businessDetailPage.sponsoredAccess.status.${grant.status}`);
  };

  const programmeLabel = (grant: SponsoredAccessGrant | null) => {
    if (!grant) return "—";
    return t(grant.programmeLabelKey);
  };

  const profileLabel = (grant: SponsoredAccessGrant | null) => {
    if (!grant?.effectiveProfileKey) return "—";
    return t(`sponsored.profiles.${grant.effectiveProfileKey}`);
  };

  const grantedByLabel = (grant: SponsoredAccessGrant | null) => {
    if (!grant?.approvedAt) return "—";
    return grant.approvedByEmail || t("format.notAvailable");
  };

  return (
    <div className="rounded-lg border border-violet-500/20 bg-violet-500/[0.04] p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Gift className="mt-0.5 h-4 w-4 shrink-0 text-violet-600 dark:text-violet-400" aria-hidden />
          <div>
            <p className="text-sm font-semibold text-foreground">
              {t("admin.businessDetailPage.sponsoredAccess.title")}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("admin.businessDetailPage.sponsoredAccess.subtitle")}
            </p>
          </div>
        </div>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" aria-hidden />
        ) : null}
      </div>

      <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">{t("admin.businessDetailPage.sponsoredAccess.statusLabel")}</dt>
          <dd className="font-medium">{statusLabel(displayGrant)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("admin.businessDetailPage.sponsoredAccess.programmeLabel")}</dt>
          <dd className="font-medium">{programmeLabel(displayGrant)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("admin.businessDetailPage.sponsoredAccess.profileLabel")}</dt>
          <dd className="font-medium">{profileLabel(displayGrant)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("admin.businessDetailPage.sponsoredAccess.grantedByLabel")}</dt>
          <dd className="font-medium">{grantedByLabel(displayGrant)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("admin.businessDetailPage.sponsoredAccess.grantedOnLabel")}</dt>
          <dd className="font-medium">
            {formatAdminDate(displayGrant?.approvedAt ?? null, locale, "—")}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">{t("admin.businessDetailPage.sponsoredAccess.expiresLabel")}</dt>
          <dd className="font-medium">
            {formatAdminDate(displayGrant?.expiresAt ?? null, locale, neverLabel)}
          </dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted-foreground">{t("admin.businessDetailPage.sponsoredAccess.notesLabel")}</dt>
          <dd className="font-medium whitespace-pre-wrap">{displayGrant?.notes?.trim() || "—"}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2 pt-1">
        {canGrant ? (
          <button
            type="button"
            disabled={saving || programmes.length === 0}
            onClick={openGrantModal}
            className={cn(platformUi.btnPrimary, "px-3 py-2 text-sm disabled:opacity-50")}
          >
            {t("admin.businessDetailPage.sponsoredAccess.grantCta")}
          </button>
        ) : null}
        {canEdit ? (
          <button
            type="button"
            disabled={saving}
            onClick={openEditModal}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted disabled:opacity-50"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
            {t("admin.businessDetailPage.sponsoredAccess.editCta")}
          </button>
        ) : null}
        {canActivate ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleActivate()}
            className={cn(platformUi.btnPrimary, "px-3 py-2 text-sm disabled:opacity-50")}
          >
            {t("admin.businessDetailPage.sponsoredAccess.activateCta")}
          </button>
        ) : null}
        {canRevoke ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => void handleRevoke()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            <ShieldOff className="h-3.5 w-3.5" aria-hidden />
            {t("admin.businessDetailPage.sponsoredAccess.revokeCta")}
          </button>
        ) : null}
      </div>

      <Dialog open={modalMode != null} onOpenChange={(open) => !open && closeModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modalMode === "grant"
                ? t("admin.businessDetailPage.sponsoredAccess.grantModalTitle")
                : t("admin.businessDetailPage.sponsoredAccess.editModalTitle")}
            </DialogTitle>
            <DialogDescription>
              {t("admin.businessDetailPage.sponsoredAccess.modalDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <label className="block text-sm">
              <span className="text-muted-foreground">
                {t("admin.businessDetailPage.sponsoredAccess.fieldProgramme")}
              </span>
              <select
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.programmeKey}
                onChange={(e) => handleProgrammeChange(e.target.value)}
              >
                {programmes.map((p) => (
                  <option key={p.programmeKey} value={p.programmeKey}>
                    {t(p.labelKey)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="text-muted-foreground">
                {t("admin.businessDetailPage.sponsoredAccess.fieldProfile")}
              </span>
              <select
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.capabilityProfileKey}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    capabilityProfileKey: e.target.value as SponsoredCapabilityProfileKey,
                  }))
                }
              >
                {profileOptions.map((p) => (
                  <option key={p.profileKey} value={p.profileKey}>
                    {t(p.labelKey)}
                  </option>
                ))}
                <option value="" disabled>
                  {t("admin.businessDetailPage.sponsoredAccess.profileCustomFuture")}
                </option>
              </select>
            </label>

            <label className="block text-sm">
              <span className="text-muted-foreground">
                {t("admin.businessDetailPage.sponsoredAccess.fieldExpiry")}
              </span>
              <input
                type="date"
                className="mt-1 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.expiresAt}
                onChange={(e) => setForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
              />
              <span className="mt-1 block text-xs text-muted-foreground">
                {t("admin.businessDetailPage.sponsoredAccess.fieldExpiryHint")}
              </span>
            </label>

            <label className="block text-sm">
              <span className="text-muted-foreground">
                {t("admin.businessDetailPage.sponsoredAccess.fieldNotes")}
              </span>
              <textarea
                className="mt-1 min-h-[88px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder={t("admin.businessDetailPage.sponsoredAccess.fieldNotesPlaceholder")}
              />
            </label>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-border px-4 py-2 text-sm"
            >
              {t("admin.businessVerificationPage.cancel")}
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => void submitForm()}
              className={cn(platformUi.btnPrimary, "px-4 py-2 text-sm disabled:opacity-50")}
            >
              {saving
                ? t("admin.businessDetailPage.sponsoredAccess.saving")
                : modalMode === "grant"
                  ? t("admin.businessDetailPage.sponsoredAccess.grantCta")
                  : t("admin.businessDetailPage.sponsoredAccess.saveChanges")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
