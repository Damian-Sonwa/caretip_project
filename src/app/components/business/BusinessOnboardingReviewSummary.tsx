import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Palette,
  Phone,
  Sparkles,
  Store,
} from "lucide-react";
import { BusinessLogoMark } from "./BusinessLogoMark";
import { cn } from "@/lib/utils";
import { BUSINESS_TYPE_I18N } from "../../lib/businessVenueOptions";

type BusinessOnboardingReviewSummaryProps = {
  legalBusinessName: string;
  businessType: string;
  registeredAddress: string;
  contactPhone: string;
  website: string;
  logoPreviewUrl: string | null;
  className?: string;
};

function ReviewSection({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="business-onboarding-review-section">
      <div className="business-onboarding-review-section__header">
        <span className="business-onboarding-review-section__icon" aria-hidden>
          {icon}
        </span>
        <h3 className="business-onboarding-review-section__title">{title}</h3>
      </div>
      <div className="business-onboarding-review-section__body">{children}</div>
    </section>
  );
}

function ReviewRow({
  label,
  value,
  empty,
}: {
  label: string;
  value: string;
  empty?: boolean;
}) {
  return (
    <div className="business-onboarding-review-row">
      <p className="business-onboarding-review-row__label">{label}</p>
      <p
        className={cn(
          "business-onboarding-review-row__value",
          empty && "business-onboarding-review-row__value--empty",
        )}
      >
        {value}
      </p>
    </div>
  );
}

export function BusinessOnboardingReviewSummary({
  legalBusinessName,
  businessType,
  registeredAddress,
  contactPhone,
  website,
  logoPreviewUrl,
  className,
}: BusinessOnboardingReviewSummaryProps) {
  const { t } = useTranslation();

  const typeLabel = businessType.trim()
    ? BUSINESS_TYPE_I18N[businessType]
      ? t(BUSINESS_TYPE_I18N[businessType])
      : businessType
    : t("business.onboarding.fields.optional");

  const optional = t("business.onboarding.fields.optional");
  const displayName = legalBusinessName.trim() || t("business.onboarding.preview.placeholderVenueName");

  return (
    <div className={cn("business-onboarding-review-card", className)}>
      <div className="business-onboarding-review-card__hero">
        <BusinessLogoMark logoPathOrUrl={logoPreviewUrl} businessName={displayName} size="md" />
        <div className="min-w-0 flex-1">
          <p className="business-onboarding-review-card__eyebrow">
            {t("business.onboarding.review.summaryEyebrow")}
          </p>
          <h2 className="business-onboarding-review-card__title">{displayName}</h2>
          <p className="business-onboarding-review-card__subtitle">{typeLabel}</p>
        </div>
      </div>

      <ReviewSection
        icon={<Store className="h-4 w-4" />}
        title={t("business.onboarding.review.sections.businessInfo")}
      >
        <ReviewRow label={t("business.onboarding.fields.legalName")} value={displayName} empty={!legalBusinessName.trim()} />
        <ReviewRow label={t("business.onboarding.fields.businessType")} value={typeLabel} empty={!businessType.trim()} />
      </ReviewSection>

      <ReviewSection
        icon={<Phone className="h-4 w-4" />}
        title={t("business.onboarding.review.sections.contactInfo")}
      >
        <ReviewRow
          label={t("business.onboarding.fields.address")}
          value={registeredAddress.trim() || optional}
          empty={!registeredAddress.trim()}
        />
        <ReviewRow
          label={t("business.onboarding.fields.phone")}
          value={contactPhone.trim() || optional}
          empty={!contactPhone.trim()}
        />
        <ReviewRow
          label={t("business.onboarding.fields.website")}
          value={website.trim() || optional}
          empty={!website.trim()}
        />
      </ReviewSection>

      <ReviewSection
        icon={<Palette className="h-4 w-4" />}
        title={t("business.onboarding.review.sections.branding")}
      >
        <ReviewRow
          label={t("business.onboarding.review.brandingLabel")}
          value={
            logoPreviewUrl
              ? t("business.onboarding.review.logoAdded")
              : t("business.onboarding.review.logoSkipped")
          }
          empty={!logoPreviewUrl}
        />
      </ReviewSection>

      <ReviewSection
        icon={<Sparkles className="h-4 w-4" />}
        title={t("business.onboarding.review.sections.publicPage")}
      >
        <div className="business-onboarding-review-public">
          <Building2 className="h-4 w-4 shrink-0 text-orange-600 dark:text-orange-400" aria-hidden />
          <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
            {t("business.onboarding.review.publicPageReady")}
          </p>
        </div>
      </ReviewSection>
    </div>
  );
}
