import { cn } from "@/lib/utils";

/** Plus Jakarta headlines + Inter UI — scoped to onboarding */
export const onboardingDisplayFont =
  '"Plus Jakarta Sans", "Plus Jakarta Sans Fallback", ui-sans-serif, system-ui, sans-serif';

export const onboardingUiFont = 'var(--font-inter)';

export const onboardingHeadline = cn(
  "text-balance font-bold tracking-tight text-zinc-900 dark:text-zinc-50",
  "text-[clamp(1.75rem,4.5vw,2.375rem)] leading-[1.12]",
);

export const onboardingSubhead = cn(
  "max-w-lg text-base leading-relaxed text-zinc-500 dark:text-zinc-400",
);

export const onboardingStepTitle = cn(
  "font-bold tracking-tight text-zinc-900 dark:text-zinc-50",
  "text-xl sm:text-[1.375rem] leading-snug",
);

export const onboardingStepHint = cn(
  "mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400",
);

export const onboardingLabel = cn(
  "mb-2 block text-sm font-medium leading-snug text-zinc-600 dark:text-zinc-400",
);

export const onboardingFieldHint = cn(
  "mt-2 text-xs leading-relaxed text-zinc-500 dark:text-zinc-500",
);

export const onboardingInput = cn(
  "w-full rounded-xl border border-zinc-200 bg-white py-3 px-4",
  "text-[15px] font-normal text-zinc-900 placeholder:text-zinc-400",
  "transition-all duration-200 ease-out",
  "hover:border-zinc-300",
  "focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10",
  "disabled:cursor-not-allowed disabled:opacity-50",
  "dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-500",
  "dark:hover:border-zinc-600",
  "dark:focus:border-orange-500 dark:focus:ring-orange-500/15",
);

export const onboardingSelect = cn(
  onboardingInput,
  "business-onboarding-select cursor-pointer appearance-none bg-no-repeat pr-11",
);

export const onboardingFileInput = cn(
  onboardingInput,
  "py-2.5 text-sm file:mr-3 file:rounded-lg file:border-0",
  "file:bg-orange-500/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-orange-600",
  "dark:file:bg-orange-500/15 dark:file:text-orange-400",
);

export const onboardingBackBtn = cn(
  "inline-flex min-h-[3rem] items-center justify-center gap-2 rounded-xl px-5",
  "text-sm font-medium text-zinc-600 transition-all duration-200",
  "hover:text-zinc-900 hover:bg-zinc-100/80",
  "disabled:pointer-events-none disabled:opacity-30",
  "dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-100",
);

export const onboardingContinueBtn = cn(
  "caretip-btn-primary inline-flex min-h-[3rem] w-full items-center justify-center gap-2",
  "rounded-xl px-6 text-[15px] font-medium tracking-[0.01em]",
  "shadow-[0_8px_24px_-8px_rgba(234,88,12,0.45)]",
  "transition-all duration-200 ease-out active:scale-[0.98]",
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none disabled:active:scale-100",
);

export const onboardingTrustItem = cn(
  "text-xs font-normal leading-relaxed text-zinc-500 dark:text-zinc-500",
);
