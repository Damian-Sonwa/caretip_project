export function FullPageLoader({ message = "Setting things up for you..." }: { message?: string }) {
  return (
    <div className="flex min-h-[70vh] w-full items-center justify-center px-6 py-14">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-primary"
          aria-hidden
        />
        <p className="text-sm font-semibold text-foreground">{message}</p>
        <p className="text-xs text-muted-foreground">This will only take a moment.</p>
      </div>
    </div>
  );
}

