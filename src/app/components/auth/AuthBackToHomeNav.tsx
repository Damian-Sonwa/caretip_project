import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { CareTipLogo } from "../CareTipLogo";

type AuthBackToHomeNavProps = {
  className?: string;
  /** Light text + offsets for the dark marketing hero column. */
  variant?: "marketing" | "form";
  /** When false, only the Back to Home link is shown (e.g. standalone admin login). */
  showLogo?: boolean;
};

/**
 * Persistent escape hatch on auth flows — optional logo + text link to landing.
 */
export function AuthBackToHomeNav({
  className,
  variant = "form",
  showLogo = true,
}: AuthBackToHomeNavProps) {
  const { t } = useTranslation();
  const label = t("staticPages.common.backToHome");
  const onMarketing = variant === "marketing";

  return (
    <nav
      className={cn("caretip-auth-back-home", onMarketing && "caretip-auth-back-home--marketing", className)}
      aria-label={label}
    >
      {showLogo ? (
        <Link
          to="/"
          className={cn(
            "caretip-auth-back-home__logo touch-manipulation rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            onMarketing
              ? "focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
              : "focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f8f7] dark:focus-visible:ring-offset-background",
          )}
          aria-label={label}
        >
          <CareTipLogo
            size="xs"
            className="!h-9 !max-h-9 !min-h-9 !max-w-[7.5rem] sm:!max-w-[8.5rem]"
          />
        </Link>
      ) : null}
      <Link
        to="/"
        className={cn(
          "caretip-auth-back-home__link touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          onMarketing
            ? "focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950"
            : "focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f8f8f7] dark:focus-visible:ring-offset-background",
        )}
        aria-label={label}
      >
        <span className="caretip-auth-back-home__arrow" aria-hidden>
          ←
        </span>
        <span>{label}</span>
      </Link>
    </nav>
  );
}
