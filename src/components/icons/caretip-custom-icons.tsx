import type { SVGProps } from "react";
import { CARE_ICON_STROKE_WIDTH } from "./caretip-icon.constants";

export type CareTipIconProps = SVGProps<SVGSVGElement> & {
  strokeWidth?: number;
};

function baseProps({
  className,
  strokeWidth = CARE_ICON_STROKE_WIDTH,
  ...props
}: CareTipIconProps) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
    ...props,
  };
}

/** Tips — coin stack with heart accent (brand gratitude). */
export function CareTipTipsIcon(props: CareTipIconProps) {
  return (
    <svg {...baseProps(props)} aria-hidden={props["aria-label"] ? undefined : true}>
      <ellipse cx="12" cy="17" rx="6" ry="2" />
      <path d="M9 14.5c0-2.2 1.3-4 3-4s3 1.8 3 4" />
      <path d="M12 6.5c1.4 0 2.5 1.1 2.5 2.5 0 1.8-1.2 3.2-2.5 4.5-1.3-1.3-2.5-2.7-2.5-4.5C9.5 7.6 10.6 6.5 12 6.5z" />
    </svg>
  );
}

/** Earnings — upward trend with currency cue. */
export function CareTipEarningsIcon(props: CareTipIconProps) {
  return (
    <svg {...baseProps(props)} aria-hidden={props["aria-label"] ? undefined : true}>
      <path d="M4 18h16" />
      <path d="M7 14l3.5-4 3 3 4.5-6" />
      <circle cx="18" cy="6" r="2.25" />
    </svg>
  );
}

/** Employee performance — person with achievement star. */
export function CareTipEmployeePerformanceIcon(props: CareTipIconProps) {
  return (
    <svg {...baseProps(props)} aria-hidden={props["aria-label"] ? undefined : true}>
      <circle cx="10" cy="8" r="3" />
      <path d="M5 19c0-3.3 2.2-5 5-5s5 1.7 5 5" />
      <path d="M17.5 6.5 18.8 9l2.7.4-2 1.9.5 2.7-2.4-1.3-2.4 1.3.5-2.7-2-1.9 2.7-.4z" />
    </svg>
  );
}

/** Goals — concentric target rings. */
export function CareTipGoalsIcon(props: CareTipIconProps) {
  return (
    <svg {...baseProps(props)} aria-hidden={props["aria-label"] ? undefined : true}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1.25" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Hospitality venue — storefront with service mark. */
export function CareTipHospitalityVenueIcon(props: CareTipIconProps) {
  return (
    <svg {...baseProps(props)} aria-hidden={props["aria-label"] ? undefined : true}>
      <path d="M5 20V9l2-4h10l2 4v11" />
      <path d="M5 12h14" />
      <path d="M9 20v-4h6v4" />
      <path d="M10 9v2M12 8v3M14 9v2" />
    </svg>
  );
}

/** Table QR — table surface + QR corner markers. */
export function CareTipTableQrIcon(props: CareTipIconProps) {
  return (
    <svg {...baseProps(props)} aria-hidden={props["aria-label"] ? undefined : true}>
      <rect x="4" y="10" width="12" height="8" rx="1" />
      <path d="M4 14h12" />
      <path d="M17 5h3v3M17 11h3v3M20 5v3M17 8h3" />
      <rect x="17.5" y="5.5" width="2" height="2" fill="currentColor" stroke="none" />
      <rect x="17.5" y="11.5" width="2" height="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Analytics — balanced bar chart. */
export function CareTipAnalyticsIcon(props: CareTipIconProps) {
  return (
    <svg {...baseProps(props)} aria-hidden={props["aria-label"] ? undefined : true}>
      <path d="M4 20V4" />
      <path d="M4 20h16" />
      <rect x="7" y="12" width="3" height="8" rx="0.5" />
      <rect x="11.5" y="8" width="3" height="12" rx="0.5" />
      <rect x="16" y="5" width="3" height="15" rx="0.5" />
    </svg>
  );
}

/** Notifications — bell with unread dot. */
export function CareTipNotificationsIcon(props: CareTipIconProps) {
  return (
    <svg {...baseProps(props)} aria-hidden={props["aria-label"] ? undefined : true}>
      <path d="M12 4c-2.2 0-4 1.6-4 3.6v2.9c0 .7-.3 1.4-.8 1.9L6 14.5h12l-1.2-2.1c-.5-.5-.8-1.2-.8-1.9V7.6C16 5.6 14.2 4 12 4z" />
      <path d="M10 17a2 2 0 0 0 4 0" />
      <circle cx="17" cy="6" r="2.25" fill="currentColor" stroke="none" />
    </svg>
  );
}
