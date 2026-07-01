import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { EmptyState } from "../ui/EmptyState";
import { dashboardWorkspaceUi } from "../dashboard/dashboardWorkspaceUi";
import { cn } from "@/lib/utils";
import type { ListLoadErrorKind } from "../../lib/listFilterUx";
import { listLoadErrorMessage } from "../../lib/listFilterUx";

type ListFilterLoadErrorProps = {
  kind?: ListLoadErrorKind;
  message?: string | null;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
};

export function ListFilterLoadError({
  kind = "api",
  message,
  onRetry,
  className,
  compact,
}: ListFilterLoadErrorProps) {
  const { t } = useTranslation();
  const displayMessage = message?.trim() || listLoadErrorMessage(kind, t);

  return (
    <EmptyState
      compact={compact}
      className={className}
      icon={<AlertCircle className="h-6 w-6 text-destructive" aria-hidden />}
      title={displayMessage}
      description={t("common.listFilter.loadError.hint")}
      action={
        onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className={cn(dashboardWorkspaceUi.btnSecondary, "min-h-[40px] px-4 text-sm")}
          >
            {t("common.listFilter.retry")}
          </button>
        ) : undefined
      }
    />
  );
}
