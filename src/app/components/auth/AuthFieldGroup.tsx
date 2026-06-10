import type { ReactNode } from "react";

type AuthFieldGroupProps = {
  label: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
};

export function AuthFieldGroup({ label, htmlFor, children, className }: AuthFieldGroupProps) {
  return (
    <div className={className ?? "caretip-auth-field-group"}>
      <label htmlFor={htmlFor} className="caretip-auth-label">
        {label}
      </label>
      {children}
    </div>
  );
}
