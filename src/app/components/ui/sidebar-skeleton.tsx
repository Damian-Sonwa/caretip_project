import { cn } from "@/lib/utils";

type SidebarSkeletonProps = {
  className?: string;
  /** Desktop fixed sidebar (lg+) vs mobile sheet drawer. */
  variant?: "desktop" | "mobile";
};

export function SidebarSkeleton({ className, variant = "desktop" }: SidebarSkeletonProps) {
  const shell =
    variant === "desktop"
      ? "hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-border lg:bg-card/50 lg:backdrop-blur-xl"
      : "flex w-64 flex-col border-r border-border bg-card text-foreground";

  return (
    <aside className={cn(shell, className)} aria-label="Loading navigation" aria-busy="true">
      <div className="px-6 py-4">
        <div className="h-6 w-28 rounded-md bg-muted animate-pulse" />
        <div className="mt-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
          <div className="min-w-0 flex-1">
            <div className="h-3 w-32 rounded bg-muted animate-pulse" />
            <div className="mt-2 h-2.5 w-20 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <ul className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              <div className="h-5 w-5 rounded bg-muted animate-pulse" />
              <div className="h-3 w-28 rounded bg-muted animate-pulse" />
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          <div className="min-w-0 flex-1">
            <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            <div className="mt-2 h-2.5 w-32 rounded bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    </aside>
  );
}

