import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type ContactSocialProofProps = {
  className?: string;
};

export function ContactSocialProof({ className }: ContactSocialProofProps) {
  const { t } = useTranslation();

  return (
    <div className={cn("caretip-contact-social-proof", className)}>
      <p className="caretip-contact-social-proof__tagline">{t("staticPages.contact.socialProof.tagline")}</p>
      <p className="caretip-contact-social-proof__segments" aria-label={t("staticPages.contact.socialProof.segmentsAria")}>
        {t("staticPages.contact.socialProof.segments")}
      </p>
    </div>
  );
}
