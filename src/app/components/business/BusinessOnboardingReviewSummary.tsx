import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Building2, Globe, MapPin, Phone } from "lucide-react";
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

function ReviewRow({
  icon,
  label,
  value,
  empty,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  empty?: boolean;
}) {
  return (
    <div className="flex gap-3 py-3">
      <div className="mt-0.5 shrink-0 text-zinc-400 dark:text-zinc-500">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          {label}
        </p>
        <p
          className={cn(
            "mt-0.5 text-sm font-medium text-zinc-900 dark:text-zinc-100",
            empty && "italic text-zinc-400 dark:text-zinc-500",
          )}
        >
          {value}
        </p>
      </div>
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

  return (
    <div
      className={cn(
        "rounded-xl border border-zinc-200/80 bg-white/80 p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40",
        className,
      )}
    >
      <div className="flex items-start gap-4 border-b border-zinc-200/80 pb-4 dark:border-zinc-800">
        <BusinessLogoMark
          logoPathOrUrl={logoPreviewUrl}
          businessName={legalBusinessName.trim() || t("business.onboarding.preview.placeholderVenueName")}
          size="md"
        />
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="text-base font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {legalBusinessName.trim() || t("business.onboarding.preview.placeholderVenueName")}
          </h3>
          <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{typeLabel}</p>
        </div>
      </div>

      <div className="divide-y divide-zinc-200/80 dark:divide-zinc-800">
        <ReviewRow
          icon={<MapPin className="size-4" aria-hidden />}
          label={t("business.onboarding.fields.address")}
          value={registeredAddress.trim() || optional}
          empty={!registeredAddress.trim()}
        />
        <ReviewRow
          icon={<Phone className="size-4" aria-hidden />}
          label={t("business.onboarding.fields.phone")}
          value={contactPhone.trim() || optional}
          empty={!contactPhone.trim()}
        />
        <ReviewRow
          icon={<Globe className="size-4" aria-hidden />}
          label={t("business.onboarding.fields.website")}
          value={website.trim() || optional}
          empty={!website.trim()}
        />
        <ReviewRow
          icon={<Building2 className="size-4" aria-hidden />}
          label={t("business.onboarding.review.brandingLabel")}
          value={
            logoPreviewUrl
              ? t("business.onboarding.review.logoAdded")
              : t("business.onboarding.review.logoSkipped")
          }
          empty={!logoPreviewUrl}
        />
      </div>
    </div>
  );
}
