import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Check, Lock, Receipt, ShieldCheck, Users } from "lucide-react";
import { BusinessLogoMark } from "../../components/business/BusinessLogoMark";
import { CustomerVenueBanner } from "../../components/customer/CustomerVenueBanner";
import { ProfileAvatar } from "../../components/ui/profile-avatar";
import { CustomerJourneyCareTipAttribution } from "./CustomerJourneyCareTipAttribution";
import type { CustomerJourneyVenueBrand } from "./customerJourneyBrand";
import { guestBrandAccentColor } from "../../lib/businessBranding";
import { formatEur } from "../../lib/formatEur";
import {
  guestSuccessPageStyle,
  guestSuccessPrimaryButtonStyle,
} from "./guestBrandingPresentation";
import type { TipSuccessEmployeeProfile } from "./useTipSuccessEmployeeProfile";

export type TipSuccessExperienceProps = {
  venue: CustomerJourneyVenueBrand;
  employee: TipSuccessEmployeeProfile;
  thankYouMessage: string;
  headline?: string;
  tipAmount?: number | null;
  transactionId?: string | null;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
  primaryIcon?: ReactNode;
  showReceipt?: boolean;
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

function SuccessHeroIcon({ accent }: { accent: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="customer-flow-success-hero relative mx-auto mb-8 flex size-[5.5rem] items-center justify-center sm:size-[6rem]"
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
        className="customer-flow-success-hero__icon flex size-[4.25rem] items-center justify-center rounded-full sm:size-[4.5rem]"
        style={{
          background: `linear-gradient(145deg, ${accent} 0%, ${accent}dd 100%)`,
          boxShadow: `0 18px 40px -14px ${accent}88, 0 0 0 10px ${accent}14`,
        }}
      >
        <Check className="size-9 text-white sm:size-10" strokeWidth={2.75} />
      </span>
    </motion.div>
  );
}

export function TipSuccessExperience({
  venue,
  employee,
  thankYouMessage,
  headline,
  tipAmount,
  transactionId,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary,
  primaryIcon,
  showReceipt = true,
}: TipSuccessExperienceProps) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const branding = venue.branding;
  const accent = guestBrandAccentColor(branding);
  const welcomeMessage =
    branding?.premium && branding.welcomeMessage?.trim()
      ? branding.welcomeMessage.trim()
      : venue.tagline?.trim() || null;
  const displayHeadline = headline ?? t("tipFlow.success.celebrationHeadline");
  const hasBio = Boolean(employee.bio?.trim());
  const fadeUp = reduceMotion
    ? {}
    : {
        initial: { y: 16, opacity: 0 },
        animate: { y: 0, opacity: 1 },
      };

  return (
    <div className="customer-flow customer-flow-success-page min-h-[100dvh]" style={guestSuccessPageStyle(branding)}>
      <div className="customer-flow-success-ambient" style={{ "--success-accent": accent } as React.CSSProperties} aria-hidden />
      <SuccessParticles accent={accent} />

      <div className="caretip-container relative z-[1] mx-auto flex min-h-[100dvh] max-w-lg flex-col items-center justify-center px-4 py-10 sm:px-6 sm:py-14">
        {branding?.premium ? (
          <div className="mb-5 w-full overflow-hidden rounded-2xl shadow-[0_12px_40px_-24px_rgba(15,23,42,0.35)]">
            <CustomerVenueBanner branding={branding} className="rounded-2xl" />
          </div>
        ) : null}
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
              className="mx-auto mb-4"
            />
            <h1 className="customer-flow-success-card__venue">{venue.name}</h1>
            {welcomeMessage ? (
              <p className="customer-flow-success-card__welcome">{welcomeMessage}</p>
            ) : null}
          </header>

          <SuccessHeroIcon accent={accent} />

          <div className="text-center">
            <motion.h2
              className="customer-flow-success-card__headline"
              {...fadeUp}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              {displayHeadline}
            </motion.h2>
            <motion.p
              className="customer-flow-success-card__thankyou"
              {...fadeUp}
              transition={{ delay: 0.28, duration: 0.4 }}
            >
              {thankYouMessage}
            </motion.p>
          </div>

          <motion.div
            className="customer-flow-success-appreciation mt-8"
            {...fadeUp}
            transition={{ delay: 0.34, duration: 0.4 }}
          >
            <p className="customer-flow-success-appreciation__label">
              {t("tipFlow.success.supportingLabel")}
            </p>
            <div className="mt-4 flex flex-col items-center gap-3">
              <ProfileAvatar
                src={employee.avatar}
                displayName={employee.name}
                className="customer-flow-success-appreciation__avatar h-[4.75rem] w-[4.75rem] ring-[3px] sm:h-20 sm:w-20"
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

          {(tipAmount != null && tipAmount > 0) || showReceipt ? (
            <motion.div
              className="customer-flow-success-summary mt-8"
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
                {transactionId ? (
                  <li>
                    <Receipt className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 truncate font-mono text-xs">{transactionId}</span>
                  </li>
                ) : null}
              </ul>
            </motion.div>
          ) : null}

          <motion.div
            className="customer-flow-success-actions mt-9"
            {...fadeUp}
            transition={{ delay: 0.48, duration: 0.4 }}
          >
            <button
              type="button"
              onClick={onPrimary}
              className="customer-flow-success-primary-btn"
              style={guestSuccessPrimaryButtonStyle(branding)}
            >
              {primaryIcon ?? <Users className="size-5 shrink-0" aria-hidden />}
              {primaryLabel}
            </button>
            <button type="button" onClick={onSecondary} className="customer-flow-success-secondary-btn">
              {secondaryLabel}
            </button>
          </motion.div>

          <footer className="customer-flow-success-trust mt-8 text-center">
            <p>{t("tipFlow.success.trustPoweredBy")}</p>
            <p>{t("tipFlow.success.trustCompleted")}</p>
          </footer>
        </motion.article>

        <div className="mt-8 w-full max-w-md">
          <CustomerJourneyCareTipAttribution label={t("tipFlow.common.poweredByCareTip")} />
        </div>
      </div>
    </div>
  );
}
