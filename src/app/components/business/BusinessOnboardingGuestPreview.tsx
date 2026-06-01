import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Building2, MapPin, QrCode, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { CareTipLogo } from "../CareTipLogo";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { customerFlowUi as cf } from "../../pages/customer/customerFlowUi";
import { resolveMediaUrl } from "../../lib/mediaUrl";
import { cn } from "@/lib/utils";
import { buildPreviewStaffSlots } from "./businessOnboardingGuestPreview.utils";
import type { GuestPreviewData } from "./BusinessOnboardingGuestPreview.types";
import type { PreviewStaffSlot } from "./businessOnboardingGuestPreview.utils";

export type { GuestPreviewData } from "./BusinessOnboardingGuestPreview.types";

const BRAND_ORANGE = "#e9781c";

type BusinessOnboardingGuestPreviewProps = GuestPreviewData & {
  variant?: "default" | "final";
};

type PreviewLine = {
  text: string;
  isPlaceholder: boolean;
};

const TYPE_I18N: Record<string, string> = {
  Restaurant: "business.onboarding.businessTypes.restaurant",
  Hotel: "business.onboarding.businessTypes.hotel",
  Salon: "business.onboarding.businessTypes.salon",
  Bar: "business.onboarding.businessTypes.bar",
  Cafe: "business.onboarding.businessTypes.cafe",
  Other: "business.onboarding.businessTypes.other",
};

function previewLine(value: string, placeholderKey: string, t: (key: string) => string): PreviewLine {
  const trimmed = value.trim();
  if (trimmed.length > 0) return { text: trimmed, isPlaceholder: false };
  return { text: t(placeholderKey), isPlaceholder: true };
}

function PreviewStaffCard({
  staff,
  t,
}: {
  staff: PreviewStaffSlot[];
  t: (key: string, options?: Record<string, string>) => string;
}) {
  return (
    <Card className={cf.cardShadcn}>
      <CardHeader className={`${cf.cardHeaderPadding} pb-2`}>
        <CardTitle className={`${cf.cardTitle} text-base`}>
          {t("business.onboarding.preview.selectStaffToTip")}
        </CardTitle>
        <CardDescription className={cf.cardDesc}>
          {t("business.onboarding.preview.selectStaffToTipDesc")}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <ul className="business-onboarding-guest-preview__staff-grid">
          {staff.map((member, index) => (
            <li key={`${member.initials}-${index}`}>
              <div
                className={cn(
                  "business-onboarding-guest-preview__staff-tile",
                  member.isPlaceholder && "business-onboarding-guest-preview__staff-tile--placeholder",
                )}
              >
                <div
                  className={cn(
                    "business-onboarding-guest-preview__staff-avatar bg-gradient-to-br",
                    member.tone,
                    member.isPlaceholder && "business-onboarding-guest-preview__staff-avatar--placeholder",
                  )}
                >
                  {member.initials}
                </div>
                <span
                  className={cn(
                    "business-onboarding-guest-preview__staff-name",
                    member.isPlaceholder && "business-onboarding-guest-preview__text--placeholder",
                  )}
                >
                  {t(`business.onboarding.preview.staffRoles.${member.roleKey}`)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function BusinessOnboardingGuestPreview({
  legalBusinessName,
  businessType,
  registeredAddress,
  logoFile,
  savedLogoPath,
  employeeCount,
  onboardingStep,
  variant = "default",
}: BusinessOnboardingGuestPreviewProps) {
  const { t } = useTranslation();
  const [uploadLogoUrl, setUploadLogoUrl] = useState<string | null>(null);
  const [heroLogoFailed, setHeroLogoFailed] = useState(false);
  const isFinal = variant === "final";

  useEffect(() => {
    if (!logoFile) {
      setUploadLogoUrl(null);
      return;
    }
    const url = URL.createObjectURL(logoFile);
    setUploadLogoUrl(url);
    setHeroLogoFailed(false);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  useEffect(() => {
    setHeroLogoFailed(false);
  }, [savedLogoPath, logoFile]);

  const venueNameLine = useMemo(
    () => previewLine(legalBusinessName, "business.onboarding.preview.placeholderVenueName", t),
    [legalBusinessName, t],
  );

  const venueTypeLine = useMemo(() => {
    if (!businessType.trim()) {
      return {
        text: t("business.onboarding.preview.placeholderVenueType"),
        isPlaceholder: true,
      };
    }
    const key = TYPE_I18N[businessType];
    return {
      text: key ? t(key) : businessType,
      isPlaceholder: false,
    };
  }, [businessType, t]);

  const addressLine = useMemo(
    () => previewLine(registeredAddress, "business.onboarding.preview.placeholderAddress", t),
    [registeredAddress, t],
  );

  const hasBusinessName = legalBusinessName.trim().length > 0;
  const displayName = venueNameLine.text;

  const heroLogoSrc = uploadLogoUrl ?? resolveMediaUrl(savedLogoPath ?? undefined) ?? null;
  const showHeroImage = Boolean(heroLogoSrc) && !heroLogoFailed;

  const previewStaff = useMemo(
    () => buildPreviewStaffSlots(legalBusinessName, businessType),
    [legalBusinessName, businessType],
  );

  const staffReadyCount = employeeCount > 0 ? employeeCount : 2;

  const showAddressMeta = onboardingStep >= 2 || !addressLine.isPlaceholder;

  const chromeSubtitle = t("business.onboarding.preview.selectStaffToTip");

  const helperText = hasBusinessName
    ? t("business.onboarding.preview.helperTextNamed", { name: displayName })
    : t("business.onboarding.preview.helperText");

  return (
    <section
      className="business-onboarding-guest-preview"
      aria-label={t("business.onboarding.preview.panelAria")}
    >
      <div className="business-onboarding-guest-preview__intro">
        <div className="business-onboarding-guest-preview__heading-row">
          <p className="business-onboarding-guest-preview__label" id="onboarding-guest-preview-label">
            {t("business.onboarding.preview.liveLabel")}
          </p>
          <span className="business-onboarding-guest-preview__badge">
            {t("business.onboarding.preview.previewOnlyBadge")}
          </span>
        </div>
        <p className="business-onboarding-guest-preview__helper">{helperText}</p>
      </div>

      <div
        className="business-onboarding-guest-preview__device-wrap"
        role="group"
        aria-labelledby="onboarding-guest-preview-label"
      >
        <p id="onboarding-guest-preview-helper" className="sr-only">
          {hasBusinessName
            ? t("business.onboarding.preview.guestAriaNamed", { name: displayName })
            : t("business.onboarding.preview.guestAria")}
        </p>

        <div className="business-onboarding-guest-preview__device" aria-hidden="true">
          <div className="business-onboarding-guest-preview__device-notch" />
          <div className="business-onboarding-guest-preview__device-screen customer-flow">
            <div className="business-onboarding-guest-preview__chrome-header">
              <CareTipLogo
                size="xs"
                className="business-onboarding-guest-preview__chrome-caretip-logo shrink-0"
              />
              <div className="business-onboarding-guest-preview__chrome-titles">
                <p
                  className={cn(
                    "business-onboarding-guest-preview__chrome-name",
                    venueNameLine.isPlaceholder && "business-onboarding-guest-preview__text--placeholder",
                  )}
                >
                  {displayName}
                </p>
                <p className="business-onboarding-guest-preview__chrome-sub">{chromeSubtitle}</p>
              </div>
            </div>

            <div className="business-onboarding-guest-preview__scroll">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <div className={cf.card}>
                  <div className="business-onboarding-guest-preview__hero">
                    {showHeroImage ? (
                      <img
                        src={heroLogoSrc!}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={() => setHeroLogoFailed(true)}
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center"
                        style={{ backgroundColor: BRAND_ORANGE }}
                      >
                        <Building2 className="h-14 w-14 text-white/85" aria-hidden />
                      </div>
                    )}
                    <div className="business-onboarding-guest-preview__hero-gradient" />
                  </div>
                  <CardContent className="space-y-4 p-5">
                    <div>
                      <h2
                        className={cn(
                          "business-onboarding-guest-preview__venue-title",
                          venueNameLine.isPlaceholder && "business-onboarding-guest-preview__text--placeholder",
                        )}
                      >
                        {displayName}
                      </h2>
                      <div className="business-onboarding-guest-preview__meta-row">
                        {showAddressMeta ? (
                          <span className="business-onboarding-guest-preview__meta-item">
                            <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                            <span
                              className={cn(
                                addressLine.isPlaceholder &&
                                  "business-onboarding-guest-preview__text--placeholder",
                              )}
                            >
                              {addressLine.text}
                            </span>
                          </span>
                        ) : null}
                        <span className="business-onboarding-guest-preview__meta-item">
                          <Building2 className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                          <span
                            className={cn(
                              venueTypeLine.isPlaceholder && "business-onboarding-guest-preview__text--placeholder",
                            )}
                          >
                            {venueTypeLine.text}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="business-onboarding-guest-preview__staff-pill">
                      <Users className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                      <span>
                        {hasBusinessName
                          ? t("tipFlow.qrLanding.staffReady", { count: staffReadyCount })
                          : t("business.onboarding.preview.staffReadyGeneric")}
                      </span>
                    </div>
                  </CardContent>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="business-onboarding-guest-preview__stack-gap"
              >
                {isFinal ? (
                  <Card className={cf.cardShadcn}>
                    <CardContent className="flex flex-col items-center gap-3 py-6">
                      <div className="business-onboarding-guest-preview__qr-frame">
                        <QrCode className="h-11 w-11 text-zinc-400" strokeWidth={1.25} aria-hidden />
                      </div>
                      <p className="business-onboarding-guest-preview__qr-caption">
                        {hasBusinessName
                          ? t("business.onboarding.preview.qrPreviewFor", { name: displayName })
                          : t("business.onboarding.preview.qrPreviewLabel")}
                      </p>
                    </CardContent>
                  </Card>
                ) : null}
                <PreviewStaffCard staff={previewStaff} t={t} />
              </motion.div>
            </div>

            <div className="business-onboarding-guest-preview__bottom-bar">
              <div className="business-onboarding-guest-preview__bottom-cta" role="presentation">
                {isFinal
                  ? t("business.onboarding.preview.tipButtonPreview")
                  : t("business.onboarding.preview.previewPayBar")}
              </div>
            </div>
          </div>
        </div>

        <div className="business-onboarding-guest-preview__device-shadow" aria-hidden />
      </div>
    </section>
  );
}
