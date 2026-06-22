import type { ReactNode } from "react";
import { ContactTrustRow } from "@/components/contact/ContactTrustRow";
import { ContactReassurancePanel } from "@/components/contact/ContactReassurancePanel";
import { cn } from "@/lib/utils";

type ContactFormStageProps = {
  variant: "demo" | "support";
  children: ReactNode;
  className?: string;
};

export function ContactFormStage({ variant, children, className }: ContactFormStageProps) {
  return (
    <div className={cn("caretip-contact-form-stage", className)}>
      <ContactTrustRow />
      {children}
      <ContactReassurancePanel variant={variant} />
    </div>
  );
}
