import type { ComponentType } from "react";
import { cn } from "@/lib/utils";

type WordmarkProps = {
  className?: string;
};

/** HTML wordmarks — reliable rendering (avoids SVG text rendering issues). */
const logoClass = (className?: string) =>
  cn(
    "caretip-hospitality-partner-logo inline-flex shrink-0 flex-col justify-center leading-none",
    className,
  );

const wordPrimary =
  "block whitespace-nowrap font-sans text-[0.8125rem] font-semibold tracking-[0.06em] text-inherit sm:text-sm";
const wordSecondary =
  "mt-0.5 block whitespace-nowrap font-sans text-[0.6875rem] font-medium tracking-[0.12em] text-neutral-500 dark:text-neutral-400 sm:text-xs";
const wordSerifPrimary =
  "block whitespace-nowrap font-serif text-[0.8125rem] font-semibold tracking-[0.08em] text-inherit sm:text-sm";
const wordSerifSecondary =
  "mt-0.5 block whitespace-nowrap font-serif text-[0.6875rem] font-normal tracking-[0.16em] text-neutral-500 dark:text-neutral-400 sm:text-xs";

export function AureliaHotelsLogo({ className }: WordmarkProps) {
  return (
    <span className={cn(logoClass(className), "min-w-[5.75rem]")} aria-hidden>
      <span className={wordSerifPrimary}>AURELIA</span>
      <span className={wordSerifSecondary}>HOTELS</span>
    </span>
  );
}

export function PalmPlateLogo({ className }: WordmarkProps) {
  return (
    <span className={cn(logoClass(className), "min-w-[6.5rem]")} aria-hidden>
      <span className={wordPrimary}>
        PALM <span className="font-normal opacity-80">&</span> PLATE
      </span>
    </span>
  );
}

export function SolisCafeLogo({ className }: WordmarkProps) {
  return (
    <span className={cn(logoClass(className), "min-w-[5.5rem]")} aria-hidden>
      <span className={wordPrimary}>
        SOLIS <span className="font-medium text-neutral-500 dark:text-neutral-400">CAFÉ</span>
      </span>
    </span>
  );
}

export function NoirLoungeLogo({ className }: WordmarkProps) {
  return (
    <span className={cn(logoClass(className), "min-w-[6.25rem]")} aria-hidden>
      <span className={wordPrimary}>
        NOIR <span className="text-[0.75rem] font-medium tracking-[0.14em] text-neutral-500 dark:text-neutral-400 sm:text-xs">LOUNGE</span>
      </span>
    </span>
  );
}

export function HarborDiningLogo({ className }: WordmarkProps) {
  return (
    <span className={cn(logoClass(className), "min-w-[5.75rem]")} aria-hidden>
      <span className={wordSerifPrimary}>HARBOR</span>
      <span className={wordSerifSecondary}>DINING</span>
    </span>
  );
}

export function CasaVerdeLogo({ className }: WordmarkProps) {
  return (
    <span className={cn(logoClass(className), "min-w-[5.5rem]")} aria-hidden>
      <span className={cn(wordSerifPrimary, "font-medium italic")}>
        Casa <span className="not-italic font-sans font-semibold tracking-[0.1em]">VERDE</span>
      </span>
    </span>
  );
}

export function EmberSuitesLogo({ className }: WordmarkProps) {
  return (
    <span className={cn(logoClass(className), "min-w-[5.75rem]")} aria-hidden>
      <span className={wordPrimary}>EMBER</span>
      <span className={wordSecondary}>SUITES</span>
    </span>
  );
}

export function VelvetBistroLogo({ className }: WordmarkProps) {
  return (
    <span className={cn(logoClass(className), "min-w-[5.75rem]")} aria-hidden>
      <span className={wordSerifPrimary}>VELVET</span>
      <span className={wordSerifSecondary}>BISTRO</span>
    </span>
  );
}

export type HospitalityPartnerId =
  | "aurelia"
  | "palmPlate"
  | "solisCafe"
  | "noirLounge"
  | "harborDining"
  | "casaVerde"
  | "emberSuites"
  | "velvetBistro";

export const HOSPITALITY_PARTNER_BRANDS: {
  id: HospitalityPartnerId;
  labelKey: string;
  Logo: ComponentType<WordmarkProps>;
}[] = [
  { id: "aurelia", labelKey: "landing.trustedVenues.partners.aurelia", Logo: AureliaHotelsLogo },
  { id: "palmPlate", labelKey: "landing.trustedVenues.partners.palmPlate", Logo: PalmPlateLogo },
  { id: "solisCafe", labelKey: "landing.trustedVenues.partners.solisCafe", Logo: SolisCafeLogo },
  { id: "noirLounge", labelKey: "landing.trustedVenues.partners.noirLounge", Logo: NoirLoungeLogo },
  { id: "harborDining", labelKey: "landing.trustedVenues.partners.harborDining", Logo: HarborDiningLogo },
  { id: "casaVerde", labelKey: "landing.trustedVenues.partners.casaVerde", Logo: CasaVerdeLogo },
  { id: "emberSuites", labelKey: "landing.trustedVenues.partners.emberSuites", Logo: EmberSuitesLogo },
  { id: "velvetBistro", labelKey: "landing.trustedVenues.partners.velvetBistro", Logo: VelvetBistroLogo },
];
