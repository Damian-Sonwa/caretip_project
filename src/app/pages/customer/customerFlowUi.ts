/**
 * Public customer tipping journey — presentation tokens aligned with the
 * employee/business dashboard rhythm (premium cards, spacing, shadows).
 * Presentation only — no flow or payment logic.
 */

import { caretipBtnPrimaryFull, caretipBtnSecondaryFull } from "@/lib/caretipButtonSystem";

export const customerFlowUi = {
  /** Root shell */
  page: "customer-flow min-h-screen bg-background",
  /** Space for fixed bottom CTAs */
  pageWithBottomCta: "customer-flow min-h-screen bg-background pb-28 sm:pb-32",

  stickyHeader:
    "sticky top-0 z-20 border-b border-neutral-200/65 bg-background/90 backdrop-blur-xl supports-[backdrop-filter]:bg-background/80 shadow-[0_4px_24px_-14px_rgba(15,23,42,0.07)]",

  headerInner:
    "caretip-container flex min-w-0 items-center gap-3 py-3.5 sm:gap-4 sm:py-4",

  headline:
    "min-w-0 truncate text-base font-semibold tracking-tight text-foreground sm:text-lg",
  subline: "text-xs leading-snug text-muted-foreground",

  backButton:
    "inline-flex min-h-[2.75rem] min-w-[2.75rem] shrink-0 items-center justify-center rounded-xl border border-transparent text-foreground transition-colors hover:bg-muted/70 active:bg-muted disabled:opacity-40",

  /** Primary scroll column — balanced readable width */
  main: "caretip-container mx-auto max-w-xl space-y-6 py-8 sm:space-y-7 sm:py-10",

  fixedBottomBar:
    "fixed bottom-0 left-0 right-0 z-30 border-t border-border/65 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/85 shadow-[0_-12px_40px_-20px_rgba(15,23,42,0.12)]",
  fixedBottomInner: "caretip-container mx-auto max-w-xl py-4",

  /** Dashboard-style elevated surface */
  card:
    "overflow-hidden rounded-2xl border border-neutral-200/75 bg-card shadow-[0_10px_36px_-14px_rgba(15,23,42,0.1)]",

  cardMuted:
    "overflow-hidden rounded-2xl border border-border/60 bg-muted/25 shadow-[0_6px_24px_-14px_rgba(15,23,42,0.06)]",

  cardAccentWash:
    "overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] via-card to-accent/[0.05] shadow-[0_10px_36px_-14px_rgba(15,23,42,0.1)]",

  /** Merge onto shadcn `Card` */
  cardShadcn:
    "rounded-2xl border-neutral-200/75 shadow-[0_10px_36px_-14px_rgba(15,23,42,0.1)]",

  cardHeaderPadding: "px-5 pb-3 pt-5 sm:px-6 sm:pb-4 sm:pt-6",
  cardTitle: "text-base font-semibold tracking-tight text-foreground",
  cardDesc: "text-sm leading-relaxed text-muted-foreground",

  selectableTile:
    "min-h-[5rem] rounded-2xl border-2 p-4 text-left transition-[border-color,box-shadow,background-color] motion-reduce:transition-none sm:min-h-[5.75rem]",
  selectableIdle:
    "border-border/70 bg-card shadow-[0_6px_22px_-14px_rgba(15,23,42,0.08)] hover:border-primary/35 hover:shadow-[0_10px_30px_-16px_rgba(15,23,42,0.11)]",
  selectableOn:
    "border-primary bg-primary/[0.07] shadow-[0_12px_32px_-16px_rgba(15,23,42,0.14)] ring-1 ring-primary/15",

  inputField:
    "w-full rounded-2xl border border-border/70 bg-card px-4 py-3.5 text-foreground placeholder:text-muted-foreground transition-shadow focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",

  inputAmount:
    "w-full rounded-2xl border-2 border-border/70 bg-card py-4 pl-11 pr-4 text-3xl font-bold tabular-nums text-foreground focus-visible:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",

  dashedCustomTrigger:
    "w-full rounded-2xl border-2 border-dashed border-border/60 bg-muted/15 py-6 transition-colors hover:border-primary/30 hover:bg-muted/25",

  /** Primary CTA — landing orange + global button scale */
  btnPrimaryLg: caretipBtnPrimaryFull,

  btnSecondaryLg: caretipBtnSecondaryFull,

  /** Payment / tip confirm — same primary system as browse CTAs */
  btnAccentLg: caretipBtnPrimaryFull,

  paymentMethodRow:
    "flex w-full min-h-[4.5rem] items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all sm:min-h-[4.75rem]",
  paymentMethodOn: "border-primary bg-primary/[0.06] shadow-md ring-1 ring-primary/12",
  paymentMethodOff:
    "border-border/70 bg-card shadow-[0_4px_18px_-12px_rgba(15,23,42,0.06)] hover:border-primary/25 hover:shadow-md",

  stateCenter:
    "flex min-h-[min(100dvh,48rem)] flex-col items-center justify-center px-4 py-12 text-center",
  stateError: "mb-2 max-w-md text-sm font-medium text-destructive",

  starButton:
    "inline-flex min-h-[3rem] min-w-[3rem] items-center justify-center rounded-xl p-1 transition-colors hover:bg-muted/50 sm:min-h-[3.25rem] sm:min-w-[3.25rem]",
} as const;
