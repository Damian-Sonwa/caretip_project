import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme, type ThemePreference } from "@/app/context/ThemeContext";
import { dashboardWorkspaceUi } from "@/app/components/dashboard/dashboardWorkspaceUi";

const OPTIONS: { value: ThemePreference; labelKey: string; descKey: string }[] = [
  { value: "light", labelKey: "theme.appearance.light", descKey: "theme.appearance.lightDesc" },
  { value: "dark", labelKey: "theme.appearance.dark", descKey: "theme.appearance.darkDesc" },
  { value: "system", labelKey: "theme.appearance.system", descKey: "theme.appearance.systemDesc" },
];

type ThemeAppearanceControlProps = {
  className?: string;
  /** Compact layout for inline settings sections. */
  variant?: "panel" | "inline";
};

export function ThemeAppearanceControl({ className, variant = "panel" }: ThemeAppearanceControlProps) {
  const { t } = useTranslation();
  const { preference, setPreference } = useTheme();

  return (
    <fieldset className={cn("min-w-0 space-y-3", className)}>
      <legend className={cn(dashboardWorkspaceUi.sectionTitle, "mb-1")}>
        {t("theme.appearance.title")}
      </legend>
      <p className={cn(dashboardWorkspaceUi.helperText, variant === "inline" && "sr-only")}>
        {t("theme.appearance.description")}
      </p>
      <div
        className="space-y-2"
        role="radiogroup"
        aria-label={t("theme.appearance.title")}
      >
        {OPTIONS.map((option) => {
          const selected = preference === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 transition-colors",
                selected
                  ? "border-primary/40 bg-primary/[0.06] ring-1 ring-primary/20"
                  : "border-border bg-card hover:bg-muted/40",
              )}
            >
              <input
                type="radio"
                name="caretip-theme-preference"
                className="mt-1 shrink-0 accent-[hsl(var(--primary))]"
                checked={selected}
                onChange={() => setPreference(option.value)}
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-foreground">{t(option.labelKey)}</span>
                  {selected ? (
                    <Check className="size-4 shrink-0 text-primary" aria-hidden />
                  ) : null}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                  {t(option.descKey)}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
