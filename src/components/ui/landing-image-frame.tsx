import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Shared, subtle frame for landing-page photography and previews.
 * (14px radius, no visible border, very light depth — not a heavy “boxed” card.)
 */
export const landingImageFrameClassName =
  "overflow-hidden rounded-[14px] shadow-[0_4px_16px_rgba(0,0,0,0.05)]";

export type LandingImageFrameProps = React.HTMLAttributes<HTMLDivElement>;

export function LandingImageFrame({ className, ...props }: LandingImageFrameProps) {
  return <div className={cn(landingImageFrameClassName, className)} {...props} />;
}
