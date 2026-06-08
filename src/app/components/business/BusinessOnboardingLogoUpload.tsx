import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ImagePlus, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { onboardingLabel } from "./businessOnboardingUi";

const ACCEPT = "image/png,image/jpeg,image/jpg,image/svg+xml";

type BusinessOnboardingLogoUploadProps = {
  file: File | null;
  onFile: (file: File | null) => void;
};

export function BusinessOnboardingLogoUpload({ file, onFile }: BusinessOnboardingLogoUploadProps) {
  const { t } = useTranslation();
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const applyFile = useCallback(
    (next: File | null) => {
      if (!next) {
        onFile(null);
        return;
      }
      if (!next.type.startsWith("image/")) return;
      onFile(next);
    },
    [onFile],
  );

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    applyFile(e.target.files?.[0] ?? null);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    applyFile(e.dataTransfer.files?.[0] ?? null);
  };

  const clear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFile(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="min-w-0">
      <span className={onboardingLabel} id={`${inputId}-label`}>
        {t("business.onboarding.fields.logo")}
      </span>

      <div
        role="button"
        tabIndex={0}
        aria-labelledby={`${inputId}-label`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "business-onboarding-logo-drop relative flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed px-6 py-8 text-center transition-all duration-200",
          dragging
            ? "border-orange-500 bg-orange-500/5 ring-4 ring-orange-500/10"
            : "border-zinc-200 bg-zinc-50/80 hover:border-zinc-300 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:border-zinc-600",
          previewUrl && "py-6",
        )}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={onInputChange}
        />

        {previewUrl ? (
          <div className="flex w-full flex-col items-center gap-3">
            <img src={previewUrl} alt="" className="max-h-24 max-w-[14rem] object-contain object-center" />
            <p className="max-w-full truncate text-sm font-medium text-zinc-700 dark:text-zinc-200">
              {file?.name}
            </p>
            <button
              type="button"
              onClick={clear}
              className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-orange-600 hover:underline dark:text-zinc-400"
            >
              {t("business.onboarding.upload.remove")}
            </button>
          </div>
        ) : (
          <>
            <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200/80 dark:bg-zinc-800 dark:ring-zinc-700">
              <Upload className="h-5 w-5 text-zinc-500 dark:text-zinc-400" aria-hidden />
            </span>
            <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
              {t("business.onboarding.upload.cta")}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              {t("business.onboarding.upload.formats")}
            </p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-orange-600 dark:text-orange-400">
              <ImagePlus className="h-3.5 w-3.5" aria-hidden />
              {t("business.onboarding.upload.dragHint")}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
