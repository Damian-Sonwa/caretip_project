import type { ReactElement } from "react";

/** i18n inline tags for landing copy (`<bold>…</bold>`). */
export const landingBoldComponents: Record<string, ReactElement> = {
  bold: <strong className="font-semibold text-foreground" />,
};
