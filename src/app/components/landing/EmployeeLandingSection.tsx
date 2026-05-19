import { LayoutDashboard } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { LandingEarningsPulse } from "@/app/components/landing/LandingEarningsPulse";
import {
  LandingShowcaseVisualFrame,
  LandingSplitShowcaseSection,
} from "@/app/components/landing/LandingSplitShowcaseSection";
import { landingUi } from "@/components/landing/landingUi";
import { cn } from "@/lib/utils";
import newEmployeeImg from "../../../../images/cafe-employee.png";

export function EmployeeLandingSection() {
  const { t } = useTranslation();

  const benefits = useMemo(
    () => [
      { title: t("landing.employeeSection.b1Title"), description: t("landing.employeeSection.b1Text") },
      { title: t("landing.employeeSection.b2Title"), description: t("landing.employeeSection.b2Text") },
      { title: t("landing.employeeSection.b3Title"), description: t("landing.employeeSection.b3Text") },
    ],
    [t],
  );

  return (
    <LandingSplitShowcaseSection
      id="for-employees"
      visualPosition="left"
      tone="muted"
      eyebrow={t("landing.employeeSection.pill")}
      eyebrowVariant="spark"
      titleLine1={t("landing.employeeSection.titleLine1")}
      titleLine2={t("landing.employeeSection.titleLine2")}
      subtitle={t("landing.employeeSection.subtitle")}
      benefits={benefits}
      benefitsVariant="showcase"
      cta={{
        label: t("landing.employeeSection.cta"),
        to: "/join",
        icon: <LayoutDashboard className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />,
      }}
      visual={
        <LandingShowcaseVisualFrame>
          <div className={cn(landingUi.showcaseVisualFrame, "relative")}>
            <img
              src={newEmployeeImg}
              alt={t("landing.employeeSection.imageAlt")}
              className={cn(landingUi.showcaseVisualImg, "object-[50%_24%]")}
              loading="lazy"
              decoding="async"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-gradient-to-t from-neutral-900/35 via-neutral-900/12 to-transparent"
            />
            <LandingEarningsPulse
              className="absolute bottom-3 left-3 z-20 sm:bottom-6 sm:left-6"
            />
          </div>
        </LandingShowcaseVisualFrame>
      }
    />
  );
}
