import type { TFunction } from "i18next";

/** Action + recipient in one natural line; helper text supports the title (no stacked fragments). */
export function headerChooseAmountFor(
  t: TFunction,
  name: string,
  opts?: { directStaffQr?: boolean },
) {
  return {
    stepTitle: t("tipFlow.header.chooseAmountFor", { name }),
    trustMessage: opts?.directStaffQr
      ? t("tipFlow.header.confirmRecipientHint")
      : t("tipFlow.header.chooseAmountHint"),
  };
}

export function headerCompletePaymentFor(t: TFunction, name: string) {
  return {
    stepTitle: t("tipFlow.header.completePaymentFor", { name }),
    trustMessage: t("tipFlow.header.completePaymentHint"),
  };
}

export function headerLeaveFeedbackFor(t: TFunction, name: string) {
  return {
    stepTitle: t("tipFlow.header.leaveFeedbackFor", { name }),
    trustMessage: t("tipFlow.header.leaveFeedbackHint"),
  };
}

export function headerSelectTeamMember(t: TFunction) {
  return {
    stepTitle: t("tipFlow.header.selectTeamMember"),
    trustMessage: t("tipFlow.header.selectTeamMemberHint"),
  };
}

export function headerThankYouFor(t: TFunction, name: string, feedbackSubmitted?: boolean) {
  return {
    stepTitle: t("tipFlow.header.thankYouFor", { name }),
    trustMessage: feedbackSubmitted
      ? t("tipFlow.completion.feedbackReceived")
      : t("tipFlow.header.thankYouHint"),
  };
}

export function headerLeaveTipFor(t: TFunction, name: string) {
  return {
    stepTitle: t("tipFlow.header.leaveTipFor", { name }),
    trustMessage: t("tipFlow.header.leaveTipHint"),
  };
}

export function headerConfirmingTipFor(t: TFunction, name?: string | null) {
  return {
    stepTitle: name
      ? t("tipFlow.header.confirmingTipFor", { name })
      : t("tipFlow.loading.confirmingTip"),
    trustMessage: t("tipFlow.header.confirmingTipHint"),
  };
}
