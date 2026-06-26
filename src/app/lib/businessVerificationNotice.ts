import type { TFunction } from "i18next";
import type { User } from "../hooks/useAuth";

/** Business dashboard home — inline verification card; layout banner is suppressed here. */
export const BUSINESS_VERIFICATION_INLINE_ROUTE = "/dashboard";

export type BusinessVerificationNoticeState = {
  show: boolean;
  rejected: boolean;
  pending: boolean;
};

type NoticeUser = Pick<User, "role" | "status" | "impersonation"> | null | undefined;

export function resolveBusinessVerificationNoticeState(
  user: NoticeUser,
): BusinessVerificationNoticeState {
  if (!user || user.role !== "business" || user.impersonation) {
    return { show: false, rejected: false, pending: false };
  }

  const rejected = user.status === "REJECTED";
  const pending = user.status === "PENDING";
  return {
    show: pending || rejected,
    rejected,
    pending,
  };
}

/** Routes that render verification inline — never show the layout banner too. */
export function shouldSuppressLayoutVerificationBanner(pathname: string): boolean {
  return pathname === BUSINESS_VERIFICATION_INLINE_ROUTE;
}

export function getBusinessVerificationNoticeLabels(t: TFunction, rejected: boolean) {
  return {
    title: rejected
      ? t("business.dashboard.verificationBannerRejectedTitle")
      : t("business.dashboard.verificationBannerTitle"),
    description: rejected
      ? t("business.dashboard.verificationBannerRejectedDesc")
      : t("business.dashboard.verificationBannerDesc"),
    cta: t("business.dashboard.verificationBannerCta"),
  };
}
