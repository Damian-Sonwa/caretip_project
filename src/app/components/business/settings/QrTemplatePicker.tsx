import { useTranslation } from "react-i18next";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DEFAULT_QR_TEMPLATE,
  type QrTemplateId,
} from "../../../lib/qrTemplateStyles";
import { listGalleryTemplates } from "../../../lib/qrTemplateEngine";
import type { QrTemplateDefinition } from "../../../lib/qrTemplateEngine/types";

type QrTemplatePickerProps = {
  value: QrTemplateId;
  onChange: (template: QrTemplateId) => void;
  canEdit: boolean;
  accentColor: string;
  backgroundColor: string;
  displayName: string;
  tagline?: string | null;
};

function proceduralPreviewGradient(template: QrTemplateDefinition): string {
  const variant = template.background.kind === "procedural" ? template.background.variant : null;
  switch (variant) {
    case "velvet-lounge":
      return "linear-gradient(180deg, #14060c 0%, #2a1018 50%, #0a0408 100%)";
    case "grand-atelier":
      return "linear-gradient(135deg, #0c0c0c 0%, #161616 50%, #080808 100%)";
    case "royal-suite":
      return "linear-gradient(180deg, #0a1424 0%, #122038 50%, #060c18 100%)";
    case "champagne-salon":
      return "linear-gradient(180deg, #faf6ef 0%, #f0e8da 55%, #e6dcc8 100%)";
    default:
      return "linear-gradient(180deg, #0A0A0A 0%, #111111 55%, #F4F2EE 72%, #0A0A0A 100%)";
  }
}

function EngineTemplatePreview({
  template,
  selected,
  accentColor,
}: {
  template: QrTemplateDefinition;
  selected: boolean;
  accentColor: string;
}) {
  const bgSrc = template.background.kind === "image" ? template.background.src : null;

  return (
    <div
      className={cn(
        "relative flex min-h-[10rem] flex-col overflow-hidden rounded-lg border-2 bg-neutral-950",
        selected ? "border-primary" : "border-border",
      )}
      style={!bgSrc ? { borderColor: selected ? accentColor : undefined } : undefined}
    >
      {bgSrc ? (
        <img
          src={bgSrc}
          alt=""
          className="h-full w-full object-cover object-top"
          draggable={false}
        />
      ) : (
        <div
          className="flex h-full min-h-[10rem] flex-1 items-center justify-center"
          style={{ background: proceduralPreviewGradient(template) }}
        >
          <div
            className="grid grid-cols-5 gap-px rounded bg-white p-1 shadow-sm"
            style={{ width: "3.5rem", height: "3.5rem" }}
            aria-hidden
          >
            {Array.from({ length: 25 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square"
                style={{
                  backgroundColor: i % 3 === 0 ? accentColor : "transparent",
                  opacity: i % 3 === 0 ? 0.9 : 0,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function QrTemplatePicker({
  value,
  onChange,
  canEdit,
  accentColor,
  backgroundColor: _backgroundColor,
  displayName: _displayName,
  tagline: _tagline,
}: QrTemplatePickerProps) {
  const { t } = useTranslation();
  const templates = listGalleryTemplates();
  const activeValue = templates.some((tpl) => tpl.id === value)
    ? value
    : ((templates[0]?.id as QrTemplateId) ?? DEFAULT_QR_TEMPLATE);

  const gridCols =
    templates.length <= 2
      ? "grid-cols-2 max-w-2xl"
      : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4";

  return (
    <div className={cn("grid min-w-0 gap-x-3 gap-y-5", gridCols)}>
      {templates.map((template) => {
        const templateId = template.id as QrTemplateId;
        const locked = !canEdit && templateId !== DEFAULT_QR_TEMPLATE;
        const selected = activeValue === templateId;

        return (
          <button
            key={template.id}
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
            aria-label={t(template.labelKey)}
          >
            <div
              className={cn(
                "relative overflow-hidden rounded-xl transition-shadow",
                selected && !locked && "ring-2 ring-primary",
              )}
            >
              <EngineTemplatePreview template={template} selected={selected} accentColor={accentColor} />
              {locked ? (
                <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-background/50 pb-6 opacity-0 transition-opacity group-hover:opacity-100">
                  <span className="rounded-md bg-primary px-2 py-1 text-[10px] font-medium text-primary-foreground shadow">
                    {t("business.branding.templateUpgrade")}
                  </span>
                </div>
              ) : null}
            </div>
            <div className="mt-2 space-y-0.5 px-0.5">
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-sm font-semibold text-foreground">{t(template.labelKey)}</span>
                {locked ? <Lock className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden /> : null}
              </div>
              <p className="line-clamp-2 text-xs text-muted-foreground">{t(template.descriptionKey)}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
