/** Remove consumed token from the URL; keep a refresh-safe verified flag. */
export function markEmailVerificationUrlComplete(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  url.searchParams.delete("token");
  url.searchParams.set("verified", "1");
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}`);
}
