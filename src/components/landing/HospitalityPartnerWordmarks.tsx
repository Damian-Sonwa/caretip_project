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

/** German-market venue wordmarks — fixed display text (not locale-swapped). */
export function ZurLindeGasthausLogo({ className }: WordmarkProps) {
  return (
    <span className={cn(logoClass(className), "min-w-[6.25rem]")} aria-hidden>
      <span className={wordSerifPrimary}>ZUR LINDE</span>
      <span className={wordSerifSecondary}>GASTHAUS</span>
    </span>
  );
}

export function RheingoldHotelLogo({ className }: WordmarkProps) {
  return (
    <span className={cn(logoClass(className), "min-w-[6rem]")} aria-hidden>
      <span className={wordPrimary}>RHEINGOLD</span>
      <span className={wordSecondary}>HOTEL</span>
    </span>
  );
}

export function KonditoreiWeberLogo({ className }: WordmarkProps) {
  return (
    <span className={cn(logoClass(className), "min-w-[6.5rem]")} aria-hidden>
      <span className={wordPrimary}>KONDITOREI</span>
      <span className={wordSecondary}>WEBER</span>
    </span>
  );
}

export function AlpenstubeBerlinLogo({ className }: WordmarkProps) {
  return (
    <span className={cn(logoClass(className), "min-w-[6.5rem]")} aria-hidden>
      <span className={wordPrimary}>ALPENSTUBE</span>
      <span className={wordSecondary}>BERLIN</span>
    </span>
  );
}

export type HospitalityPartnerId =
  | "aurelia"
  | "zurLinde"
  | "palmPlate"
  | "rheingold"
  | "harborDining"
  | "konditoreiWeber"
  | "noirLounge"
  | "alpenstubeBerlin"
  | "solisCafe"
  | "casaVerde"
  | "emberSuites"
  | "velvetBistro";

export type HospitalityPartnerBrand = {
  id: HospitalityPartnerId;
  /** Screen-reader label — proper venue name, fixed per brand. */
  a11yLabel: string;
  Logo: ComponentType<WordmarkProps>;
};

/** Mixed EN + DE venues, interleaved — same strip in every locale. */
export const HOSPITALITY_PARTNER_BRANDS: HospitalityPartnerBrand[] = [
  { id: "aurelia", a11yLabel: "Aurelia Hotels", Logo: AureliaHotelsLogo },
  { id: "zurLinde", a11yLabel: "Zur Linde Gasthaus", Logo: ZurLindeGasthausLogo },
  { id: "palmPlate", a11yLabel: "Palm & Plate", Logo: PalmPlateLogo },
  { id: "rheingold", a11yLabel: "Rheingold Hotel", Logo: RheingoldHotelLogo },
  { id: "harborDining", a11yLabel: "Harbor Dining", Logo: HarborDiningLogo },
  { id: "konditoreiWeber", a11yLabel: "Konditorei Weber", Logo: KonditoreiWeberLogo },
  { id: "noirLounge", a11yLabel: "Noir Lounge", Logo: NoirLoungeLogo },
  { id: "alpenstubeBerlin", a11yLabel: "Alpenstube Berlin", Logo: AlpenstubeBerlinLogo },
];
