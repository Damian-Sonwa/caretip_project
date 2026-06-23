import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  QR_TEMPLATE_IDS,
  QR_TEMPLATE_PRESETS,
  previewStyleForTemplate,
  type QrTemplateId,
} from "../../../lib/qrTemplateStyles";

type QrTemplatePickerProps = {
  value: QrTemplateId;
  onChange: (template: QrTemplateId) => void;
  canEdit: boolean;
  accentColor: string;
  backgroundColor: string;
  displayName: string;
  tagline?: string | null;
};

function MiniQrPreview({
  templateId,
  accentColor,
  backgroundColor,
  displayName,
  tagline,
  selected,
}: {
  templateId: QrTemplateId;
  accentColor: string;
  backgroundColor: string;
  displayName: string;
  tagline?: string | null;
  selected: boolean;
}) {
  const preview = previewStyleForTemplate(templateId, accentColor, backgroundColor);
  const preset = QR_TEMPLATE_PRESETS[templateId];
  const title = displayName.trim() || "Your Brand";
  const sub = tagline?.trim() || preset.labelKey.split(".").pop() || "";

  return (
    <div
      className="relative flex min-h-[9rem] flex-col overflow-hidden border-2 border-transparent"
      style={{
        backgroundColor: preview.bg,
        borderRadius: preview.radius,
        borderColor: selected ? accentColor : `${accentColor}44`,
      }}
    >
      {preset.topBand ? (
        <div
          className="h-5 shrink-0"
          style={{ backgroundColor: `${preview.accent}${preset.topBandOpacity > 0.15 ? "33" : "22"}` }}
        />
      ) : null}
      <div className="flex flex-1 flex-col items-center gap-1 px-2 pb-2 pt-1.5">
        <span
          className="max-w-full shrink-0 truncate text-center text-[10px] font-semibold leading-tight"
          style={{ color: preview.lightText ? "#F5F5F5" : preview.accent }}
        >
          {title.length > 18 ? `${title.slice(0, 17)}…` : title}
        </span>
        {sub ? (
          <span
            className="max-w-full shrink-0 truncate text-center text-[8px] leading-tight opacity-75"
            style={{ color: preview.lightText ? "#E5E5E5" : preview.accent }}
          >
            {sub.length > 22 ? `${sub.slice(0, 21)}…` : sub}
          </span>
        ) : null}
        <div
          className="mt-auto grid shrink-0 grid-cols-5 gap-px p-1"
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: templateId === "modern" ? "8px" : templateId === "nightlife" ? "50%" : "4px",
            width: "3.25rem",
            height: "3.25rem",
          }}
          aria-hidden
        >
          {Array.from({ length: 25 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square"
              style={{
                backgroundColor: (i + templateId.length) % 3 === 0 ? preview.accent : "transparent",
                opacity: (i + templateId.length) % 3 === 0 ? 0.85 : 0,
              }}
            />
          ))}
        </div>
        <span
          className="shrink-0 text-[7px] font-medium opacity-70"
          style={{ color: preview.lightText ? "#D4D4D4" : preview.accent }}
        >
          Powered by CareTip
        </span>
      </div>
    </div>
  );
}

export function QrTemplatePicker({
  value,
  onChange,
  canEdit,
  accentColor,
  backgroundColor,
  displayName,
  tagline,
}: QrTemplatePickerProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4">
      {QR_TEMPLATE_IDS.map((templateId) => {
        const locked = !canEdit && templateId !== "classic";
        const selected = value === templateId;
        const preset = QR_TEMPLATE_PRESETS[templateId];

        return (
          <button
            key={templateId}
            type="button"
            disabled={locked}
            onClick={() => {
              if (!locked) onChange(templateId);
            }}
            className={cn(
              "group relative flex flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              locked ? "cursor-not-allowed" : "cursor-pointer",
            )}
            aria-pressed={selected}
            aria-label={t(preset.labelKey)}
          >
            <div
              className={cn(
                "relative overflow-hidden rounded-xl transition-shadow",
                selected && !locked && "ring-2 ring-primary",
              )}
            >
              <MiniQrPreview
                templateId={templateId}
                accentColor={accentColor}
                backgroundColor={backgroundColor}
                displayName={displayName}
                tagline={tagline}
                selected={selected}
              />
              {locked ? (
                <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-background/50 pb-6 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground shadow">
                    {t("business.branding.templateUpgrade")}
                  </span>
                </div>
              ) : null}
            </div>
            <div className="mt-1.5 flex items-center justify-between gap-1 px-0.5">
              <span className="truncate text-xs font-medium text-foreground">{t(preset.labelKey)}</span>
              {locked ? <Lock className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden /> : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
