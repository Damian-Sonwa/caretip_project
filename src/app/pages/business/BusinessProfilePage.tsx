import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Building2, Check, Loader2, MapPin, Save, Tag, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import {
  fetchBusinessProfile,
  putBusinessProfile,
  uploadMyBusinessLogo,
  type BusinessInfo,
} from "../../lib/api";
import { getAppPublicBaseUrl } from "../../lib/appPublicUrl";
import { resolveMediaUrl } from "../../lib/mediaUrl";
import { logClientError } from "../../lib/clientLog";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { BusinessLogoMark } from "../../components/business/BusinessLogoMark";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const TOAST_OK = { style: { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } } as const;
const LOGO_MAX_BYTES = 5 * 1024 * 1024;
const LOCATION_MAX = 2000;

function verificationLabel(s: BusinessInfo["verificationStatus"]): string {
  if (s === "verified") return "Verified";
  if (s === "rejected") return "Rejected";
  return "Pending";
}

function verificationClass(s: BusinessInfo["verificationStatus"]): string {
  if (s === "verified") return "bg-emerald-500/15 text-emerald-800 dark:text-emerald-200";
  if (s === "rejected") return "bg-destructive/15 text-destructive";
  return "bg-muted text-muted-foreground";
}

/**
 * Full venue profile management: read, edit (PUT), logo upload (POST), read-only slug & verification.
 */
export function BusinessProfilePage() {
  const { t } = useTranslation();
  const { user } = useRequireAuth();
  const fileInputId = useId();

  const [profile, setProfile] = useState<BusinessInfo | null>(null);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [pendingLogo, setPendingLogo] = useState<File | null>(null);
  const [logoObjectUrl, setLogoObjectUrl] = useState<string | null>(null);
  const [logoBust, setLogoBust] = useState(0);

  const [saving, setSaving] = useState(false);

  const applyProfileToForm = useCallback((p: BusinessInfo) => {
    setName(p.name);
    setLocation((p.location ?? p.registeredAddress ?? "").trim());
    setBusinessType((p.type ?? "").trim());
  }, []);

  const loadProfile = useCallback(async () => {
    if (!user?.businessId || user.role !== "business") {
      setProfile(null);
      setLoadState("idle");
      return;
    }
    setLoadState("loading");
    setLoadError(null);
    try {
      const p = await fetchBusinessProfile();
      setProfile(p);
      applyProfileToForm(p);
      setLoadState("idle");
    } catch (e) {
      logClientError("BusinessProfilePage.load", e);
      setLoadError(toUserFriendlyMessage(e));
      setLoadState("error");
      setProfile(null);
    }
  }, [user?.businessId, user?.role, applyProfileToForm]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!pendingLogo) {
      setLogoObjectUrl(null);
      return;
    }
    const u = URL.createObjectURL(pendingLogo);
    setLogoObjectUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [pendingLogo]);

  const serverLogoSrc = useMemo(() => {
    const base = resolveMediaUrl(profile?.logo ?? undefined);
    if (!base) return null;
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}v=${logoBust}`;
  }, [profile?.logo, logoBust]);

  const headerImageSrc = logoObjectUrl ?? serverLogoSrc;

  const isDirty = useMemo(() => {
    if (!profile) return false;
    if (pendingLogo) return true;
    if (name.trim() !== profile.name.trim()) return true;
    const savedLoc = (profile.location ?? profile.registeredAddress ?? "").trim();
    if (location.trim() !== savedLoc) return true;
    if ((businessType.trim() || "") !== (profile.type ?? "").trim()) return true;
    return false;
  }, [profile, name, location, businessType, pendingLogo]);

  const pickLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("business.profilePage.toastImageType"));
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast.error(t("business.profilePage.toastLogoSize"));
      return;
    }
    setPendingLogo(file);
  };

  const clearPendingLogo = () => setPendingLogo(null);

  const validateForm = (): string | null => {
    const n = name.trim();
    if (!n) return t("business.profilePage.valNameRequired");
    if (location.length > LOCATION_MAX) return t("business.profilePage.valLocationMax", { max: LOCATION_MAX });
    return null;
  };

  const handleSave = async () => {
    const err = validateForm();
    if (err) {
      toast.error(err);
      return;
    }
    if (!isDirty) return;
    setSaving(true);
    const hadPendingLogo = pendingLogo != null;
    try {
      const updated = await putBusinessProfile({
        name: name.trim(),
        businessType: businessType.trim() || null,
        location: location.trim() || null,
      });
      if (pendingLogo) {
        await uploadMyBusinessLogo(pendingLogo);
      }
      const fresh = hadPendingLogo ? await fetchBusinessProfile() : updated;
      setProfile(fresh);
      applyProfileToForm(fresh);
      if (hadPendingLogo) setLogoBust((b) => b + 1);
      setPendingLogo(null);
      window.dispatchEvent(new Event("caretip-business-profile-changed"));
      toast.success(t("business.profilePage.toastSaved"), TOAST_OK);
    } catch (e) {
      logClientError("BusinessProfilePage.save", e);
      toast.error(toUserFriendlyMessage(e));
    } finally {
      setSaving(false);
    }
  };

  if (!user?.businessId || user.role !== "business") {
    return null;
  }

  if (loadState === "loading" && !profile) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-3 px-4 py-24 sm:px-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">{t("business.profilePage.loading")}</p>
      </div>
    );
  }

  if (loadState === "error" && !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-lg">{t("business.profilePage.loadErrorTitle")}</CardTitle>
            <CardDescription>{loadError ?? t("business.profilePage.loadErrorDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" onClick={() => void loadProfile()}>
              {t("business.profilePage.tryAgain")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const slug = profile?.slug?.trim() || "";
  const publicBase = getAppPublicBaseUrl().replace(/\/+$/, "");
  const teamUrl = slug ? `${publicBase}/${slug}` : "";

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 sm:px-6">
      <header>
        <div className="mb-2 flex items-center gap-2 text-muted-foreground">
          <Building2 className="h-5 w-5 shrink-0" aria-hidden />
          <span className="text-xs font-semibold uppercase tracking-wide">{t("business.profilePage.venuePill")}</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{t("business.profilePage.pageTitle")}</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">{t("business.profilePage.pageDesc")}</p>
      </header>

      <Card className="overflow-hidden border-border shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/30">
          <CardTitle className="text-base">{t("business.profilePage.logoTitle")}</CardTitle>
          <CardDescription>{t("business.profilePage.logoDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6 pt-6 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <div className="relative">
              {headerImageSrc ? (
                <img
                  src={headerImageSrc}
                  alt=""
                  className="h-28 w-28 rounded-xl border border-border bg-white object-contain p-1 shadow-sm"
                />
              ) : (
                <BusinessLogoMark
                  logoPathOrUrl={null}
                  businessName={name.trim() || profile?.name || t("business.profilePage.venueFallback")}
                  size="xl"
                  className="h-28 w-28"
                />
              )}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <input id={fileInputId} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" className="sr-only" onChange={pickLogo} />
              <Button type="button" variant="outline" size="sm" asChild>
                <label htmlFor={fileInputId} className="cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  {pendingLogo
                    ? t("business.profilePage.changeSelection")
                    : profile?.logo
                      ? t("business.profilePage.changeLogo")
                      : t("business.profilePage.uploadLogo")}
                </label>
              </Button>
              {pendingLogo ? (
                <Button type="button" variant="ghost" size="sm" onClick={clearPendingLogo}>
                  <X className="mr-1 h-4 w-4" />
                  {t("business.profilePage.clearPreview")}
                </Button>
              ) : null}
            </div>
            {pendingLogo ? (
              <p className="max-w-xs text-center text-xs text-muted-foreground sm:text-left">
                {t("business.profilePage.pendingUploadHint", { save: t("business.profilePage.saveWord") })}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{t("business.profilePage.venueDetailsTitle")}</CardTitle>
          <CardDescription>{t("business.profilePage.venueDetailsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="biz-name">{t("business.profilePage.labelBusinessName")}</Label>
            <Input
              id="biz-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="organization"
              maxLength={200}
              placeholder={t("business.profilePage.phVenueName")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz-location" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              {t("business.profilePage.labelLocation")}
            </Label>
            <Input
              id="biz-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={LOCATION_MAX}
              placeholder={t("business.profilePage.phLocation")}
            />
            <p className="text-xs text-muted-foreground">
              {t("business.profilePage.charCount", { n: location.length, max: LOCATION_MAX })}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz-type" className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              {t("business.profilePage.labelBusinessType")}
            </Label>
            <Input
              id="biz-type"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              maxLength={120}
              placeholder={t("business.profilePage.phBusinessType")}
            />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="button" onClick={() => void handleSave()} disabled={saving || !isDirty || !name.trim()}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("business.profilePage.saving")}
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {t("business.profilePage.saveChanges")}
                </>
              )}
            </Button>
            {!isDirty ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5" aria-hidden />
                {t("business.profilePage.upToDate")}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">{t("business.profilePage.publicTitle")}</CardTitle>
          <CardDescription>{t("business.profilePage.publicDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("business.profilePage.teamQrPath")}</p>
            <p className="mt-1 break-all font-mono text-xs text-foreground sm:text-sm">{slug || "—"}</p>
            {teamUrl ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {t("business.profilePage.guestDirectory")}{" "}
                <a href={teamUrl} className="text-primary underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
                  {teamUrl}
                </a>
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{t("business.profilePage.verification")}</p>
            <span
              className={cn(
                "mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                verificationClass(profile?.verificationStatus),
              )}
            >
              {profile?.verificationStatus === "verified"
                ? t("business.profilePage.statusVerified")
                : profile?.verificationStatus === "rejected"
                  ? t("business.profilePage.statusRejected")
                  : t("business.profilePage.statusPending")}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
