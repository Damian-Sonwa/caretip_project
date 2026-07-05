import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Check, Lock, Receipt, ShieldCheck, Users } from "lucide-react";
import { BusinessLogoMark } from "../../components/business/BusinessLogoMark";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import { CustomerJourneyCareTipAttribution } from "./CustomerJourneyCareTipAttribution";
import type { CustomerJourneyVenueBrand } from "./customerJourneyBrand";
import { guestBrandAccentColor, resolveGuestCompletionSupportingText } from "../../lib/businessBranding";
import { formatEur } from "../../lib/formatEur";
import {
  guestSuccessPageStyle,
  guestSuccessPrimaryButtonStyle,
} from "./guestBrandingPresentation";
import type { TipSuccessEmployeeProfile } from "./useTipSuccessEmployeeProfile";
import { cn } from "@/lib/utils";

export type TipSuccessExperienceProps = {
  venue: CustomerJourneyVenueBrand;
  employee: TipSuccessEmployeeProfile;
  thankYouMessage: string;
  /** Completion-focused line under the venue name (not the QR landing welcome). */
  supportingText?: string | null;
  headline?: string;
  tipAmount?: number | null;
  /** Customer-facing receipt reference from the server (e.g. CT-2026-48291). */
  receiptNumber?: string | null;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  primaryIcon?: ReactNode;
  showReceipt?: boolean;
  /** Compact layout for manager branding previews. */
  embedded?: boolean;
  showAttribution?: boolean;
};

function SuccessParticles({ accent }: { accent: string }) {
  const spots = [
    { left: "12%", top: "18%", delay: "0s", size: 6 },
    { left: "82%", top: "14%", delay: "0.4s", size: 5 },
    { left: "74%", top: "72%", delay: "0.8s", size: 7 },
    { left: "18%", top: "78%", delay: "1.1s", size: 4 },
    { left: "48%", top: "8%", delay: "0.6s", size: 5 },
  ];
  return (
    <div className="customer-flow-success-particles pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {spots.map((s, i) => (
        <span
          key={i}
          className="customer-flow-success-particle"
          style={{
            left: s.left,
            top: s.top,
            width: s.size,
            height: s.size,
            animationDelay: s.delay,
            background: accent,
          }}
        />
      ))}
    </div>
  );
}

function SuccessHeroIcon({ accent, compact }: { accent: string; compact?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className={cn(
        "customer-flow-success-hero relative mx-auto flex items-center justify-center",
        compact ? "mb-4 size-[4.5rem] sm:mb-5 sm:size-[5rem]" : "mb-5 size-[5.5rem] sm:mb-6 sm:size-[6rem]",
      )}
      initial={reduceMotion ? false : { scale: 0.82, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.08 }}
      aria-hidden
    >
      <span className="customer-flow-success-ripple customer-flow-success-ripple--1" style={{ borderColor: `${accent}40` }} />
      <span className="customer-flow-success-ripple customer-flow-success-ripple--2" style={{ borderColor: `${accent}28` }} />
      <span
        className="customer-flow-success-hero__glow"
        style={{ background: `radial-gradient(circle, ${accent}55 0%, transparent 70%)` }}
      />
      <span
        className={cn(
          "customer-flow-success-hero__icon flex items-center justify-center rounded-full",
          compact ? "size-[3.5rem] sm:size-[3.75rem]" : "size-[4.25rem] sm:size-[4.5rem]",
        )}
        style={{
          background: `linear-gradient(145deg, ${accent} 0%, ${accent}dd 100%)`,
          boxShadow: `0 18px 40px -14px ${accent}88, 0 0 0 10px ${accent}14`,
        }}
      >
        <Check className={cn("text-white", compact ? "size-7 sm:size-8" : "size-9 sm:size-10")} strokeWidth={2.75} />
      </span>
    </motion.div>
  );
}

export function TipSuccessExperience({
  venue,
  employee,
  thankYouMessage,
  supportingText: supportingTextProp,
  headline,
  tipAmount,
  receiptNumber,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  primaryIcon,
  showReceipt = true,
  embedded = false,
  showAttribution = true,
}: TipSuccessExperienceProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const branding = venue.branding;
  const accent = guestBrandAccentColor(branding);
  const displaySupportingText =
    supportingTextProp?.trim() ||
    resolveGuestCompletionSupportingText(branding, t("tipFlow.success.completionSupporting"));
  const displayHeadline = headline ?? t("tipFlow.success.celebrationHeadline");
  const hasBio = Boolean(employee.bio?.trim());
  const fadeUp = reduceMotion
    ? {}
    : {
        initial: { y: 16, opacity: 0 },
        animate: { y: 0, opacity: 1 },
      };

  return (
    <div
      className={cn(
        "customer-flow customer-flow-success-page",
        embedded ? "customer-flow-success-page--embedded min-h-0" : "min-h-[100dvh]",
      )}
      style={guestSuccessPageStyle(branding)}
    >
      {!embedded ? (
        <>
          <div className="customer-flow-success-ambient" style={{ "--success-accent": accent } as React.CSSProperties} aria-hidden />
          <SuccessParticles accent={accent} />
        </>
      ) : null}

      <div
        className={cn(
          "caretip-container relative z-[1] mx-auto flex w-full max-w-lg flex-col items-center justify-center px-4",
          embedded ? "py-4 sm:px-5 sm:py-5" : "min-h-[100dvh] justify-center py-6 sm:px-6 sm:py-10",
        )}
      >
        <motion.article
          className="customer-flow-success-card w-full"
          style={{ "--success-accent": accent } as React.CSSProperties}
          {...fadeUp}
          transition={{ delay: 0.12, duration: 0.45 }}
        >
          <header className="customer-flow-success-card__brand text-center">
            <BusinessLogoMark
              logoPathOrUrl={venue.logo ?? null}
              businessName={venue.name}
              size="header"
              className={cn("mx-auto", embedded ? "mb-3" : "mb-4")}
            />
            <h1 className="customer-flow-success-card__venue">{venue.name}</h1>
            {displaySupportingText ? (
              <p className="customer-flow-success-card__supporting">{displaySupportingText}</p>
            ) : null}
          </header>

          <motion.div
            className={cn("customer-flow-success-appreciation", embedded ? "mt-4 sm:mt-5" : "mt-5 sm:mt-6")}
            {...fadeUp}
            transition={{ delay: 0.16, duration: 0.4 }}
          >
            <p className="customer-flow-success-appreciation__label">
              {t("tipFlow.success.supportingLabel")}
            </p>
            <div className="mt-3 flex flex-col items-center gap-2.5 sm:mt-4 sm:gap-3">
              <ProfileAvatar
                src={employee.avatar}
                displayName={employee.name}
                className={cn(
                  "customer-flow-success-appreciation__avatar ring-[3px]",
                  embedded
                    ? "h-[4.25rem] w-[4.25rem] sm:h-[4.5rem] sm:w-[4.5rem]"
                    : "h-[4.75rem] w-[4.75rem] sm:h-20 sm:w-20",
                )}
                lightbox={false}
              />
              <div className="min-w-0 text-center">
                <p className="customer-flow-success-appreciation__name">{employee.name}</p>
                {employee.role ? (
                  <p className="customer-flow-success-appreciation__role">{employee.role}</p>
                ) : null}
              </div>
            </div>
            {hasBio ? (
              <p className="customer-flow-success-appreciation__quote">&ldquo;{employee.bio}&rdquo;</p>
            ) : null}
          </motion.div>

          <SuccessHeroIcon accent={accent} compact={embedded} />

          <div className="text-center">
            <motion.h2
              className="customer-flow-success-card__headline"
              {...fadeUp}
              transition={{ delay: 0.24, duration: 0.4 }}
            >
              {displayHeadline}
            </motion.h2>
            <motion.p
              className="customer-flow-success-card__thankyou"
              {...fadeUp}
              transition={{ delay: 0.32, duration: 0.4 }}
            >
              {thankYouMessage}
            </motion.p>
          </div>

          {(tipAmount != null && tipAmount > 0) || showReceipt ? (
            <motion.div
              className={cn("customer-flow-success-summary", embedded ? "mt-5" : "mt-6 sm:mt-7")}
              {...fadeUp}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              {tipAmount != null && tipAmount > 0 ? (
                <div className="customer-flow-success-summary__amount-row">
                  <span className="customer-flow-success-summary__amount-label">
                    {t("tipFlow.success.tipAmount")}
                  </span>
                  <span className="customer-flow-success-summary__amount">{formatEur(tipAmount)}</span>
                </div>
              ) : null}
              <ul className="customer-flow-success-summary__meta">
                <li>
                  <ShieldCheck className="size-4 shrink-0 text-emerald-600/80 dark:text-emerald-400/90" aria-hidden />
                  {t("tipFlow.success.paymentCompleted")}
                </li>
                <li>
                  <Lock className="size-4 shrink-0 text-emerald-600/80 dark:text-emerald-400/90" aria-hidden />
                  {t("tipFlow.success.secureTransaction")}
                </li>
                {showReceipt && receiptNumber ? (
                  <li>
                    <Receipt className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 truncate text-sm tabular-nums">
                      {t("tipFlow.success.receiptReference", { code: receiptNumber })}
                    </span>
                  </li>
                ) : null}
              </ul>
            </motion.div>
          ) : null}

          <motion.div
            className={cn("customer-flow-success-actions", embedded ? "mt-6" : "mt-7 sm:mt-8")}
            {...fadeUp}
            transition={{ delay: 0.48, duration: 0.4 }}
          >
            <button
              type="button"
              onClick={onPrimary}
              className="customer-flow-success-primary-btn"
              style={guestSuccessPrimaryButtonStyle(branding)}
              tabIndex={embedded ? -1 : undefined}
              aria-disabled={embedded || undefined}
            >
              {primaryIcon ?? <Users className="size-5 shrink-0" aria-hidden />}
              {primaryLabel}
            </button>
            <button
              type="button"
              onClick={onSecondary}
              className="customer-flow-success-secondary-btn"
              tabIndex={embedded ? -1 : undefined}
              aria-disabled={embedded || undefined}
            >
              {secondaryLabel}
            </button>
          </motion.div>

          {!embedded ? (
            <footer className="customer-flow-success-trust mt-6 text-center sm:mt-7">
              <p>{t("tipFlow.success.trustPoweredBy")}</p>
              <p>{t("tipFlow.success.trustCompleted")}</p>
            </footer>
          ) : null}
        </motion.article>

        {showAttribution && !embedded ? (
          <div className="mt-6 w-full max-w-md sm:mt-7">
            <CustomerJourneyCareTipAttribution label={t("tipFlow.common.poweredByCareTip")} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
