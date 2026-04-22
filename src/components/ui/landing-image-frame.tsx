import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Shared, subtle frame for landing-page photography and previews.
 * (14px radius, hairline neutral border, very light depth — not a heavy “boxed” card.)
 */
export const landingImageFrameClassName =
  "overflow-hidden rounded-[14px] border border-[rgba(0,0,0,0.06)] shadow-[0_8px_24px_rgba(0,0,0,0.04)]";

export type LandingImageFrameProps = React.HTMLAttributes<HTMLDivElement>;

export function LandingImageFrame({ className, ...props }: LandingImageFrameProps) {
  return <div className={cn(landingImageFrameClassName, className)} {...props} />;
}
