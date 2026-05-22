import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { HOSPITALITY_PARTNER_BRANDS } from "@/components/landing/HospitalityPartnerWordmarks";
import { LogoCloud } from "@/components/ui/logo-cloud-4";
import { cn } from "@/lib/utils";

function PartnerLogoItem({
  label,
  Logo,
  className,
}: {
  label: string;
  Logo: (typeof HOSPITALITY_PARTNER_BRANDS)[number]["Logo"];
  className?: string;
}) {
  return (
    <span
      className={cn(
        "caretip-hospitality-partner-logo-item inline-flex min-w-0 shrink-0 items-center justify-center px-3 py-2 sm:px-4",
        className,
      )}
      title={label}
    >
      <Logo className="caretip-hospitality-partner-logo h-auto w-auto" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function LandingVenueLogoStrip({ className }: { className?: string }) {
  const { t } = useTranslation();

  const partners = useMemo(() => HOSPITALITY_PARTNER_BRANDS, []);

  return (
    <div
      className={cn("caretip-landing-venue-logos caretip-landing-partner-logos w-full", className)}
      aria-label={t("landing.trustedVenues.aria")}
    >
      <LogoCloud
        className="caretip-landing-logo-cloud w-full max-w-none md:max-w-4xl lg:max-w-5xl"
        fadeRgb="249, 247, 242"
      >
        {partners.map((partner) => (
          <PartnerLogoItem
            key={partner.id}
            label={partner.a11yLabel}
            Logo={partner.Logo}
          />
        ))}
      </LogoCloud>
    </div>
  );
}
