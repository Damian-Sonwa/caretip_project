import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Marquee } from "@/components/ui/marquee";
import { HOSPITALITY_PARTNER_BRANDS } from "@/components/landing/HospitalityPartnerWordmarks";
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
        "caretip-hospitality-partner-logo-item inline-flex min-w-0 items-center justify-center px-3 py-2.5 transition-opacity duration-300 ease-out sm:px-3.5",
        className,
      )}
      title={label}
    >
      <Logo />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function LandingVenueLogoStrip({ className }: { className?: string }) {
  const { t } = useTranslation();

  const partners = useMemo(
    () =>
      HOSPITALITY_PARTNER_BRANDS.map((brand) => ({
        ...brand,
        label: t(brand.labelKey),
      })),
    [t],
  );

  return (
    <div
      className={cn("caretip-landing-venue-logos caretip-landing-partner-logos", className)}
      aria-label={t("landing.trustedVenues.aria")}
    >
      <div className="caretip-venue-logos-marquee hidden lg:block">
        <Marquee durationSeconds={56} gapPx={64} pauseOnHover>
          {partners.map((partner) => (
            <PartnerLogoItem
              key={partner.id}
              label={partner.label}
              Logo={partner.Logo}
              className="shrink-0"
            />
          ))}
        </Marquee>
      </div>

      <ul className="caretip-hospitality-partner-grid caretip-social-proof-logo-grid mx-auto grid w-full max-w-4xl grid-cols-2 items-center justify-items-center gap-x-7 gap-y-7 px-1 sm:grid-cols-4 sm:gap-x-9 sm:gap-y-8 sm:px-2 lg:hidden">
        {partners.map((partner) => {
          const Logo = partner.Logo;
          return (
            <li key={partner.id} className="flex items-center justify-center">
              <PartnerLogoItem label={partner.label} Logo={Logo} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
