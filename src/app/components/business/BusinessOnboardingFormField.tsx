import type { ReactNode } from "react";
import {
  onboardingFieldHint,
  onboardingFileInput,
  onboardingInput,
  onboardingLabel,
  onboardingSelect,
} from "./businessOnboardingUi";

type TextFieldProps = {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
};

export function BusinessOnboardingTextField({ label, placeholder, value, onChange }: TextFieldProps) {
  return (
    <label className="block min-w-0">
      <span className={onboardingLabel}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={onboardingInput}
      />
    </label>
  );
}

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: ReactNode;
};

export function BusinessOnboardingSelectField({
  label,
  value,
  onChange,
  placeholder,
  children,
}: SelectFieldProps) {
  return (
    <label className="block min-w-0">
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
    <label className="block min-w-0">
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
