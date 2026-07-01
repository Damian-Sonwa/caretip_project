import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  onboardingFieldHint,
  onboardingFileInput,
  onboardingInput,
  onboardingLabel,
  onboardingOptionalBadge,
  onboardingSelect,
} from "./businessOnboardingUi";

type TextFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  optional?: boolean;
};

export function BusinessOnboardingTextField({
  label,
  placeholder,
  value,
  onChange,
  hint,
  optional,
}: TextFieldProps) {
  const { t } = useTranslation();

  return (
    <label className="business-onboarding-field block min-w-0">
      <span className={onboardingLabel}>
        {label}
        {optional ? <span className={onboardingOptionalBadge}>{t("business.onboarding.fields.optional")}</span> : null}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={onboardingInput}
      />
      {hint ? <p className={onboardingFieldHint}>{hint}</p> : null}
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  hint?: string;
  children: ReactNode;
};

export function BusinessOnboardingSelectField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  children,
}: SelectFieldProps) {
  return (
    <label className="business-onboarding-field block min-w-0">
      <span className={onboardingLabel}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={onboardingSelect}
        aria-label={label}
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      {hint ? <p className={onboardingFieldHint}>{hint}</p> : null}
    </label>
  );
}

export function BusinessOnboardingFileField({
  label,
  hint,
  onFile,
}: {
  label: string;
  hint: string;
  onFile: (file: File | null) => void;
}) {
  return (
    <label className="business-onboarding-field block min-w-0">
      <span className={onboardingLabel}>{label}</span>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
        className={onboardingFileInput}
      />
      <p className={onboardingFieldHint}>{hint}</p>
    </label>
  );
}
