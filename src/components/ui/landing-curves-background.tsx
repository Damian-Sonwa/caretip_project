import * as React from "react";

import { cn } from "@/lib/utils";

type LandingCurvesBackgroundProps = {
  className?: string;
};

function CurveSvg({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 460 154"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g clipPath="url(#clip0_494_1104)">
        <path
          d="M-87.463 458.432C-102.118 348.092 -77.3418 238.841 -15.0744 188.274C57.4129 129.408 180.708 150.071 351.748 341.128C278.246 -374.233 633.954 380.602 548.123 42.7707"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="40"
        />
      </g>
      <defs>
        <clipPath id="clip0_494_1104">
          <rect fill="white" height="154" width="460" />
        </clipPath>
      </defs>
    </svg>
  );
}

/** Subtle curved-line background layer for the landing page. */
export function LandingCurvesBackground({ className }: LandingCurvesBackgroundProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <CurveSvg className="absolute -right-24 top-24 w-[520px] rotate-0 text-neutral-200/70 blur-[0px]" />
      <CurveSvg className="absolute -left-32 bottom-0 w-[560px] -rotate-12 text-neutral-200/50" />
      <div className="absolute inset-0 bg-gradient-to-b from-gray-50/0 via-gray-50/0 to-gray-50" />
    </div>
  );
}

