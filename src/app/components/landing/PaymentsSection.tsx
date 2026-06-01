import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { CreditCard as CreditCardIcon, Smartphone, Clock, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { InteractiveCreditCard } from "@/components/ui/credit-card-1";
import { landingCopyVisible, landingUi } from "@/components/landing/landingUi";
import { LandingSectionAccent } from "@/components/landing/LandingSectionAccent";
import { landingType } from "@/components/landing/landingTypography";
import { cn } from "@/lib/utils";
import { PaymentsStripeBadge } from "./PaymentsStripeBadge";

type PaymentsTrustAccent = "orange" | "gold" | "charcoal";

const ACCENT_STYLES: Record<
  PaymentsTrustAccent,
  { iconWrap: string; icon: string }
> = {
  orange: {
    iconWrap:
      "border-primary/20 bg-gradient-to-br from-primary/[0.12] to-primary/[0.04] text-primary dark:border-primary/30 dark:from-primary/20 dark:to-primary/[0.06]",
    icon: "text-primary dark:text-[#f0a84d]",
  },
  gold: {
    iconWrap:
      "border-[#E8A84A]/25 bg-gradient-to-br from-[#F59E0B]/[0.12] to-[#F59E0B]/[0.03] text-[#C47A12] dark:border-[#F59E0B]/30 dark:from-[#F59E0B]/18 dark:to-transparent dark:text-[#FBBF24]",
    icon: "text-[#C47A12] dark:text-[#FBBF24]",
  },
  charcoal: {
    iconWrap:
      "border-neutral-300/80 bg-gradient-to-br from-neutral-100/90 to-neutral-50/40 text-neutral-600 dark:border-neutral-600/70 dark:from-neutral-800/80 dark:to-neutral-900/40 dark:text-neutral-300",
    icon: "text-neutral-600 dark:text-neutral-300",
  },
};

const ACCENT_CYCLE: PaymentsTrustAccent[] = ["orange", "gold", "charcoal", "orange"];

type PaymentsTrustItem = {
  icon: LucideIcon;
  accent: PaymentsTrustAccent;
  title: string;
  text: string;
};

export function PaymentsSection() {
  const { t } = useTranslation();
  const sectionSubtitle = t("landing.paymentsTrust.subtitle");
  const [disableCardTilt, setDisableCardTilt] = useState(true);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)");
    const narrow = window.matchMedia("(max-width: 767px)");
    const update = () => setDisableCardTilt(coarse.matches || narrow.matches);
    update();
    coarse.addEventListener("change", update);
    narrow.addEventListener("change", update);
    return () => {
      coarse.removeEventListener("change", update);
      narrow.removeEventListener("change", update);
    };
  }, []);

  const items = useMemo<PaymentsTrustItem[]>(
    () =>
      [
        {
          icon: CreditCardIcon,
          title: t("landing.paymentsTrust.b1Title"),
          text: t("landing.paymentsTrust.b1Text"),
        },
        { icon: Clock, title: t("landing.paymentsTrust.b2Title"), text: t("landing.paymentsTrust.b2Text") },
        {
          icon: Smartphone,
          title: t("landing.paymentsTrust.b3Title"),
          text: t("landing.paymentsTrust.b3Text"),
        },
        {
          icon: ShieldCheck,
          title: t("landing.paymentsTrust.b4Title"),
          text: t("landing.paymentsTrust.b4Text"),
        },
      ].map((item, index) => ({ ...item, accent: ACCENT_CYCLE[index]! })),
    [t],
  );

  return (
    <section
      id="payments-trust"
      className={cn(
        landingUi.section,
        landingUi.landingSurface,
        "caretip-payments-trust relative overflow-hidden dark:bg-[linear-gradient(180deg,#0c0c0c_0%,#111010_45%,#0c0c0c_100%)]",
      )}
    >
      <div aria-hidden className="caretip-payments-trust-ambient pointer-events-none absolute inset-0" />

      <div className="relative mx-auto max-w-7xl">
        <motion.header
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            landingUi.sectionIntro,
            "caretip-payments-trust-intro mx-auto mb-8 max-w-3xl text-center sm:mb-10 lg:mb-12",
          )}
        >
          {landingCopyVisible(t("landing.paymentsTrust.pill")) ? (
            <div className={cn(landingUi.sectionAccentRow, "mb-4 justify-center")}>
              <LandingSectionAccent variant="line" muted>
                {t("landing.paymentsTrust.pill")}
              </LandingSectionAccent>
            </div>
          ) : null}
          <h2 className={landingUi.sectionTitle}>{t("landing.paymentsTrust.title")}</h2>
          {landingCopyVisible(sectionSubtitle) ? (
            <p className={cn(landingUi.sectionSubtitle, "mx-auto max-w-2xl")}>{sectionSubtitle}</p>
          ) : null}
          {landingCopyVisible(t("landing.paymentsTrust.roleClarifier")) ? (
            <p className="caretip-payments-trust-clarifier mx-auto mt-3 max-w-xl text-center text-xs font-medium tracking-wide text-muted-foreground sm:text-[13px]">
              {t("landing.paymentsTrust.roleClarifier")}
            </p>
          ) : null}
        </motion.header>

        <div className="caretip-payments-trust-body">
          <motion.div
            className="caretip-payments-trust-visual"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <PaymentsStripeBadge
              label={t("landing.paymentsTrust.stripeBadge")}
              className="caretip-payments-trust-stripe-badge mb-4"
            />
            <InteractiveCreditCard
              variant="caretip"
              cardHolder={t("landing.paymentsTrust.cardHolder")}
              cardNumber={t("landing.paymentsTrust.cardNumber")}
              expiryDate={t("landing.paymentsTrust.cardExpiry")}
              cvv="•••"
              backLine1={t("landing.paymentsTrust.cardBackLine1")}
              backLine2={t("landing.paymentsTrust.cardBackLine2")}
              className="caretip-payments-trust-card"
              disableTilt={disableCardTilt}
            />
            <p className="caretip-payments-trust-card-hint">
              {t("landing.paymentsTrust.cardHint")}
            </p>
          </motion.div>

          <ul
            className="caretip-payments-trust-grid grid grid-cols-1 gap-7 sm:grid-cols-2 sm:gap-8 lg:gap-9"
            role="list"
          >
            {items.map((item, idx) => {
              const Icon = item.icon;
              const accent = ACCENT_STYLES[item.accent];
              return (
                <motion.li
                  key={item.title}
                  role="listitem"
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.07, ease: [0.22, 1, 0.36, 1] }}
                  className="caretip-payments-trust-item group flex min-w-0 items-start gap-4"
                >
                  <div
                    className={cn(
                      "caretip-payments-trust-icon flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border sm:h-12 sm:w-12",
                      "transition-[transform,opacity,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      "group-hover:-translate-y-0.5 group-hover:opacity-90",
                      accent.iconWrap,
                    )}
                    aria-hidden
                  >
                    <Icon
                      className={cn("h-5 w-5 sm:h-[1.35rem] sm:w-[1.35rem]", accent.icon)}
                      strokeWidth={1.75}
                    />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
                    <h3
                      className={cn(
                        landingType.featureCopySemibold,
                        "tracking-tight text-neutral-900 dark:text-neutral-50",
                      )}
                    >
                      {item.title}
                    </h3>
                    <p
                      className={cn(
                        landingType.bodyCopyMuted,
                        "text-[0.8125rem] leading-snug sm:text-sm sm:leading-relaxed",
                      )}
                    >
                      {item.text}
                    </p>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
