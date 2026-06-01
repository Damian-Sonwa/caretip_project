import { BellRing, Check, Clock } from "lucide-react";
import { useState, type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type NotificationAlertItem = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  initials?: string;
};

export type NotificationAlertDialogLabels = {
  trigger?: string;
  title: string;
  unreadSummary: (count: number) => string;
  markAllRead: string;
  close: string;
  viewAll: string;
  empty: string;
  readLabel: string;
};

export type NotificationAlertDialogProps = {
  items: NotificationAlertItem[];
  unreadCount: number;
  loading?: boolean;
  className?: string;
  trigger?: ReactNode;
  previewCount?: number;
  labels: NotificationAlertDialogLabels;
  onOpenChange?: (open: boolean) => void;
  onViewAll: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onItemActivate?: (id: string) => void;
};

function initialsFromTitle(title: string): string {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function NotificationRow({
  notification,
  onSelect,
  readLabel,
}: {
  notification: NotificationAlertItem;
  onSelect: () => void;
  readLabel: string;
}) {
  const initials = notification.initials ?? initialsFromTitle(notification.title);

  return (
    <div
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        "flex w-full min-w-0 cursor-pointer gap-3 overflow-hidden rounded-md p-3 transition-all duration-200",
        notification.read
          ? "bg-muted/60"
          : "border border-primary/15 bg-primary/5 shadow-sm dark:bg-primary/10",
      )}
      onClick={onSelect}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-medium",
          notification.read
            ? "bg-muted text-muted-foreground"
            : "bg-primary/15 text-primary dark:bg-primary/25 dark:text-[#f0a84d]",
        )}
      >
        {initials}
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
          <p
            className={cn(
              "min-w-0 truncate text-sm font-medium",
              notification.read ? "text-muted-foreground" : "text-foreground",
            )}
          >
            {notification.title}
          </p>
          <div className="flex shrink-0 items-center whitespace-nowrap text-xs text-muted-foreground">
            <Clock className="mr-1 h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{notification.time}</span>
          </div>
        </div>
        <p className="line-clamp-2 break-words text-xs text-muted-foreground">{notification.message}</p>
        {notification.read ? (
          <div className="mt-1.5 flex items-center text-xs text-primary">
            <Check className="mr-1 h-3 w-3" aria-hidden />
            {readLabel}
          </div>
        ) : null}
      </div>
      {!notification.read ? (
        <span className="mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" aria-hidden />
      ) : null}
    </div>
  );
}

export function NotificationAlertDialog({
  items,
  unreadCount,
  loading = false,
  className,
  trigger,
  previewCount = 2,
  labels,
  onOpenChange,
  onViewAll,
  onMarkRead,
  onMarkAllRead,
  onItemActivate,
}: NotificationAlertDialogProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    onOpenChange?.(open);
  };

  const handleViewAll = () => {
    setIsDialogOpen(false);
    onOpenChange?.(false);
    onViewAll();
  };

  const handleSelect = (id: string) => {
    onMarkRead(id);
    onItemActivate?.(id);
  };

  const previewItems = items.slice(0, previewCount);

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        {trigger ?? (
          <Button
            type="button"
            className={cn(
              "relative bg-primary pr-6 text-primary-foreground hover:bg-primary/90",
              className,
            )}
          >
            <BellRing className="mr-1 h-5 w-5" aria-hidden />
            {labels.trigger ?? "Notifications"}
            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="flex max-h-[min(92dvh,32rem)] w-[min(100vw-2rem,28rem)] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden border-2 border-primary/20 bg-background p-0 sm:max-w-md">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-4">
          <AlertDialogHeader className="shrink-0 space-y-2 text-left">
            <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
              <div className="flex min-w-0 items-center gap-2">
                <BellRing className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                <AlertDialogTitle className="truncate">{labels.title}</AlertDialogTitle>
              </div>
              {unreadCount > 0 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onMarkAllRead}
                  className="h-auto max-w-full shrink-0 px-2 py-1 text-xs text-primary hover:text-primary/80"
                >
                  <span className="truncate">{labels.markAllRead}</span>
                </Button>
              ) : null}
            </div>
            <AlertDialogDescription className="break-words text-left">
              {labels.unreadSummary(unreadCount)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="min-h-0 flex-1 overflow-y-auto py-3">
            <div className="space-y-2">
              {loading ? (
                <div className="space-y-2" aria-busy>
                  {[0, 1].map((i) => (
                    <div key={i} className="h-[72px] animate-pulse rounded-md bg-muted" />
                  ))}
                </div>
              ) : previewItems.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">{labels.empty}</p>
              ) : (
                previewItems.map((notification) => (
                  <NotificationRow
                    key={notification.id}
                    notification={notification}
                    readLabel={labels.readLabel}
                    onSelect={() => handleSelect(notification.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
        <AlertDialogFooter className="shrink-0 gap-2 border-t border-border p-4 sm:flex-row sm:justify-stretch">
          <AlertDialogCancel className="mt-0 w-full min-w-0 border-primary/25 text-primary hover:bg-primary/5 sm:flex-1">
            <span className="truncate">{labels.close}</span>
          </AlertDialogCancel>
          <Button
            type="button"
            className="w-full min-w-0 bg-primary text-primary-foreground hover:bg-primary/90 sm:flex-1"
            onClick={handleViewAll}
          >
            <span className="truncate">{labels.viewAll}</span>
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
