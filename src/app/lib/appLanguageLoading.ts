/** Brief global overlay while locale bundles switch. */

let active = false;
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function subscribeAppLanguageChange(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

export function isAppLanguageChangeActive(): boolean {
  return active;
}

export function beginAppLanguageChange(): void {
  if (active) return;
  active = true;
  emit();
}

export function endAppLanguageChange(): void {
  if (!active) return;
  active = false;
  emit();
}
