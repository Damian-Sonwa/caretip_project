import { useCallback, useEffect, useId, useMemo, useState } from "react";
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
      toast.error("Choose an image file (PNG, JPEG, or WebP).");
      return;
    }
    if (file.size > LOGO_MAX_BYTES) {
      toast.error("Logo must be 5 MB or smaller.");
      return;
    }
    setPendingLogo(file);
  };

  const clearPendingLogo = () => setPendingLogo(null);

  const validateForm = (): string | null => {
    const n = name.trim();
    if (!n) return "Business name is required.";
    if (location.length > LOCATION_MAX) return `Location must be at most ${LOCATION_MAX} characters.`;
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
      toast.success("Profile saved.", TOAST_OK);
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
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      </div>
    );
  }

  if (loadState === "error" && !profile) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-lg">Could not load profile</CardTitle>
            <CardDescription>{loadError ?? "Something went wrong."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" onClick={() => void loadProfile()}>
              Try again
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
          <span className="text-xs font-semibold uppercase tracking-wide">Venue</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Business profile</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Update how your venue appears to guests. Slug and verification status are managed by CareTip.
        </p>
      </header>

      <Card className="overflow-hidden border-border shadow-sm">
        <CardHeader className="border-b border-border/60 bg-muted/30">
          <CardTitle className="text-base">Logo</CardTitle>
          <CardDescription>Shown on QR pages, print layouts, and your dashboard header.</CardDescription>
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
                  businessName={name.trim() || profile?.name || "Venue"}
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
                  {pendingLogo ? "Change selection" : profile?.logo ? "Change logo" : "Upload logo"}
                </label>
              </Button>
              {pendingLogo ? (
                <Button type="button" variant="ghost" size="sm" onClick={clearPendingLogo}>
                  <X className="mr-1 h-4 w-4" />
                  Clear preview
                </Button>
              ) : null}
            </div>
            {pendingLogo ? (
              <p className="max-w-xs text-center text-xs text-muted-foreground sm:text-left">
                New logo uploads when you click <span className="font-medium text-foreground">Save changes</span>.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Venue details</CardTitle>
          <CardDescription>These fields are stored on your business record.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="biz-name">Business name</Label>
            <Input
              id="biz-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="organization"
              maxLength={200}
              placeholder="Your venue name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz-location" className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              Location
            </Label>
            <Input
              id="biz-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={LOCATION_MAX}
              placeholder="City, area, or address guests recognize"
            />
            <p className="text-xs text-muted-foreground">{location.length} / {LOCATION_MAX} characters</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="biz-type" className="flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
              Business type
            </Label>
            <Input
              id="biz-type"
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              maxLength={120}
              placeholder="e.g. Restaurant, Salon, Hotel"
            />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button type="button" onClick={() => void handleSave()} disabled={saving || !isDirty || !name.trim()}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save changes
                </>
              )}
            </Button>
            {!isDirty ? (
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Check className="h-3.5 w-3.5" aria-hidden />
                Up to date
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Public link & verification</CardTitle>
          <CardDescription>Read-only. Contact support if you need a slug change after launch.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Team QR path</p>
            <p className="mt-1 break-all font-mono text-xs text-foreground sm:text-sm">{slug || "—"}</p>
            {teamUrl ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Guest directory:{" "}
                <a href={teamUrl} className="text-primary underline-offset-2 hover:underline" target="_blank" rel="noreferrer">
                  {teamUrl}
                </a>
              </p>
            ) : null}
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Verification</p>
            <span
              className={cn(
                "mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold",
                verificationClass(profile?.verificationStatus),
              )}
            >
              {verificationLabel(profile?.verificationStatus)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
