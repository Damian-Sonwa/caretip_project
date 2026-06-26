import { useTranslation } from "react-i18next";
import { History, Loader2 } from "lucide-react";
import type { BillingTimelineEvent } from "../../../../lib/api";
import { BillingTimeline } from "./BillingTimeline";

type Props = {
  loading: boolean;
  error: string | null;
  events: BillingTimelineEvent[] | null;
  onRetry: () => void;
};

export function BillingHistoryPanel({ loading, error, events, onRetry }: Props) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex min-h-[120px] items-center justify-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        <p>{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 font-semibold underline underline-offset-2"
        >
          {t("business.billing.retry")}
        </button>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 px-6 py-10 text-center">
        <History className="mx-auto h-8 w-8 text-muted-foreground/60" aria-hidden />
        <p className="mt-3 text-sm font-semibold text-foreground">
          {t("business.billing.historyEmptyTitle")}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("business.billing.historyEmptyBody")}</p>
      </div>
    );
  }

  return <BillingTimeline events={events} />;
}
