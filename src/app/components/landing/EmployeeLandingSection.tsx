import { LayoutDashboard } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  LandingShowcaseVisualFrame,
  LandingSplitShowcaseSection,
} from "@/app/components/landing/LandingSplitShowcaseSection";
import { landingUi } from "@/components/landing/landingUi";
import { cn } from "@/lib/utils";
import employeeSectionImgDe from "../../../../images/FYP.jpeg";
import employeeSectionImgEn from "../../../../images/English-version.png";

export function EmployeeLandingSection() {
  const { t, i18n } = useTranslation();
  const isDe = i18n.language?.toLowerCase().startsWith("de");
  const employeeSectionImg = isDe ? employeeSectionImgDe : employeeSectionImgEn;

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
              src={employeeSectionImg}
              alt={t("landing.employeeSection.imageAlt")}
              className={cn(landingUi.showcaseVisualImg, "object-[center_42%]")}
              loading="lazy"
              decoding="async"
            />
          </div>
        </LandingShowcaseVisualFrame>
      }
    />
  );
}
