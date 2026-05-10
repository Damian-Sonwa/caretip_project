import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Check, ChevronDown, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover";

type LanguageSwitcherProps = {
  className?: string;
  /** Header: light surface. Inline: footer / dark band. */
  variant?: "header" | "inline";
};

export function LanguageSwitcher({ className, variant = "header" }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const active = i18n.resolvedLanguage?.toLowerCase().startsWith("de") ? "de" : "en";

  const isInline = variant === "inline";

  const triggerBase =
    "touch-manipulation inline-flex min-h-10 items-center gap-2 rounded-full border px-3 py-2 text-sm font-semibold tracking-tight transition-all outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-[0.98] sm:min-h-9 sm:px-3.5";

  const triggerStyles = isInline
    ? "border-white/25 bg-white/10 text-white shadow-[0_1px_0_rgba(255,255,255,0.08)_inset] hover:border-white/35 hover:bg-white/[0.14] focus-visible:ring-white/40 focus-visible:ring-offset-neutral-950"
    : "border-neutral-200/90 bg-white text-neutral-900 shadow-[0_1px_0_rgba(255,255,255,0.9)_inset,0_4px_14px_rgba(15,23,42,0.06)] hover:border-neutral-300 hover:bg-neutral-50/90 focus-visible:ring-[#EB992C]/35 focus-visible:ring-offset-background";

  const menuSurface = isInline
    ? "border-white/15 bg-neutral-950/98 p-1.5 text-white shadow-xl backdrop-blur-md"
    : "border-neutral-200/80 bg-white p-1.5 text-neutral-900 shadow-xl";

  const rowBase =
    "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold transition-colors";

  const rowIdle = isInline
    ? "text-neutral-200 hover:bg-white/10"
    : "text-neutral-700 hover:bg-neutral-100";

  const rowActive = isInline ? "bg-white/12 text-white" : "bg-[#fff6e8] text-neutral-900";

  const setLang = (lng: "en" | "de") => {
    void i18n.changeLanguage(lng);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(triggerBase, triggerStyles, className)}
          aria-label={t("nav.language")}
          aria-expanded={open}
          aria-haspopup="dialog"
        >
          <Globe className={cn("h-4 w-4 shrink-0 opacity-90", isInline ? "text-white/90" : "text-neutral-600")} aria-hidden />
          <span className="tabular-nums">{active === "de" ? "DE" : "EN"}</span>
          <ChevronDown
            className={cn("h-3.5 w-3.5 shrink-0 opacity-70 transition-transform", open && "-rotate-180")}
            aria-hidden
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className={cn("w-[min(100vw-1.5rem,200px)] rounded-xl p-0", menuSurface)}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-0.5" role="listbox" aria-label={t("nav.language")}>
          <button
            type="button"
            role="option"
            aria-selected={active === "en"}
            className={cn(rowBase, active === "en" ? rowActive : rowIdle)}
            onClick={() => setLang("en")}
          >
            <span>{t("nav.languageEnglish")}</span>
            {active === "en" ? (
              <Check
                className={cn("h-4 w-4 shrink-0", isInline ? "text-amber-300" : "text-[#b45309]")}
                strokeWidth={2.5}
                aria-hidden
              />
            ) : null}
          </button>
          <button
            type="button"
            role="option"
            aria-selected={active === "de"}
            className={cn(rowBase, active === "de" ? rowActive : rowIdle)}
            onClick={() => setLang("de")}
          >
            <span>{t("nav.languageGerman")}</span>
            {active === "de" ? (
              <Check
                className={cn("h-4 w-4 shrink-0", isInline ? "text-amber-300" : "text-[#b45309]")}
                strokeWidth={2.5}
                aria-hidden
              />
            ) : null}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
