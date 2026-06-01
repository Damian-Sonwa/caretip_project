import { useMemo } from "react";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { landingFadeReveal } from "@/lib/motionPerf";
import { cn } from "@/lib/utils";

const TRUST_KEYS = ["gdpr", "auth", "rbac", "analytics", "payments"] as const;

export function LandingTrustComplianceStrip({ className }: { className?: string }) {
  const { t } = useTranslation();

  const items = useMemo(
    () => TRUST_KEYS.map((key) => t(`landing.trustStrip.${key}`)),
    [t],
  );

  return (
    <motion.div
      className={cn("caretip-trust-strip", className)}
      {...landingFadeReveal}
      role="list"
      aria-label={t("landing.trustStrip.aria")}
    >
      {items.map((label) => (
        <span key={label} className="caretip-trust-strip__item" role="listitem">
          <Check className="caretip-trust-strip__check h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
          {label}
        </span>
      ))}
    </motion.div>
  );
}
