/**
 * Run async work for the same key one at a time (FIFO).
 * Prevents Supabase transaction-pool contention when many handlers share connection_limit=1.
 */
const tails = new Map<string, Promise<unknown>>();

export function runSerializedByKey<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = tails.get(key) ?? Promise.resolve();
  const next = prev.catch(() => undefined).then(fn);
  tails.set(
    key,
    next.finally(() => {
      if (tails.get(key) === next) tails.delete(key);
    }),
  );
  return next;
}
