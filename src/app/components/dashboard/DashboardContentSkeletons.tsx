import { cn } from "@/lib/utils";

function ShimmerBar({ className }: { className?: string }) {
  return (
    <span className={cn("dashboard-hero-metric-skeleton__bar block rounded-md", className)} aria-hidden />
  );
}

/** Transactions / tips activity table — preserves header + row rhythm. */
export function TipsActivityTableSkeleton({
  rows = 8,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <tbody className={className}>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-border/60">
          <td className="px-4 py-3.5">
            <ShimmerBar className="h-4 w-16" />
          </td>
          <td className="px-4 py-3.5">
            <ShimmerBar className="h-4 w-24 max-w-[7rem]" />
          </td>
          <td className="px-4 py-3.5">
            <ShimmerBar className="h-4 w-28 max-w-[9rem]" />
          </td>
          <td className="px-4 py-3.5">
            <ShimmerBar className="h-4 w-32 max-w-[10rem]" />
          </td>
          <td className="px-4 py-3.5">
            <ShimmerBar className="h-6 w-20 rounded-full" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

/** Full notifications inbox list placeholder. */
export function NotificationInboxListSkeleton({
  rows = 6,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <ul className={cn("space-y-2", className)} role="status" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
        >
          <div className="flex items-start justify-between gap-2">
            <ShimmerBar className="h-4 w-[58%] max-w-[14rem]" />
            <ShimmerBar className="h-3 w-10 shrink-0" />
          </div>
          <ShimmerBar className="mt-2 h-3 w-[82%] max-w-[18rem]" />
        </li>
      ))}
    </ul>
  );
}

/** Notification bell dropdown preview rows. */
export function NotificationPreviewListSkeleton({
  rows = 4,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <ul className={cn("divide-y divide-border", className)} role="status" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="px-3 py-2.5">
          <ShimmerBar className="h-3.5 w-[70%] max-w-[12rem]" />
          <ShimmerBar className="mt-1.5 h-2.5 w-[90%] max-w-[16rem]" />
        </li>
      ))}
    </ul>
  );
}

/** Locations page card grid. */
export function LocationCardGridSkeleton({
  cards = 4,
  className,
}: {
  cards?: number;
  className?: string;
}) {
  return (
    <ul
      className={cn("grid gap-3 sm:grid-cols-2", className)}
      role="status"
      aria-busy="true"
      aria-label="Loading"
    >
      {Array.from({ length: cards }).map((_, i) => (
        <li key={i} className="flex gap-3 rounded-xl border border-border bg-card p-4">
          <ShimmerBar className="h-10 w-10 shrink-0 rounded-lg" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <ShimmerBar className="h-4 w-[55%] max-w-[9rem]" />
            <ShimmerBar className="h-3 w-[80%] max-w-[12rem]" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Platform admin global transactions table. */
export function GlobalTransactionsTableSkeleton({
  rows = 8,
}: {
  rows?: number;
}) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-border/60">
          <td className="px-4 py-3.5">
            <ShimmerBar className="h-4 w-28" />
          </td>
          <td className="px-4 py-3.5">
            <ShimmerBar className="h-4 w-32" />
          </td>
          <td className="px-4 py-3.5">
            <ShimmerBar className="ml-auto h-4 w-16" />
          </td>
          <td className="px-4 py-3.5">
            <ShimmerBar className="ml-auto h-4 w-14" />
          </td>
          <td className="px-4 py-3.5">
            <ShimmerBar className="ml-auto h-4 w-16" />
          </td>
          <td className="px-4 py-3.5">
            <ShimmerBar className="h-6 w-20 rounded-full" />
          </td>
        </tr>
      ))}
    </tbody>
  );
}

/** Tables management page — header + body rows. */
export function TablesListSkeleton({
  rows = 6,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("overflow-x-auto", className)} role="status" aria-busy="true" aria-label="Loading">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            {["w-28", "w-32", "w-36", "w-16"].map((w, i) => (
              <th key={i} className="px-4 py-3">
                <ShimmerBar className={cn("h-3.5", w)} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <tr key={i} className="border-b border-border/60">
              <td className="px-4 py-3.5">
                <ShimmerBar className="h-4 w-24" />
              </td>
              <td className="px-4 py-3.5">
                <ShimmerBar className="h-4 w-28" />
              </td>
              <td className="px-4 py-3.5">
                <ShimmerBar className="h-4 w-32" />
              </td>
              <td className="px-4 py-3.5">
                <ShimmerBar className="h-8 w-16 rounded-md" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
